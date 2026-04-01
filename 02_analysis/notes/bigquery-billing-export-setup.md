# 🔗 Google BigQuery Billing Export — Setup Guide

## 🎯 Mục tiêu & Scope

Tài liệu này giải thích **tại sao** không lấy được billing data của Google qua API thông thường, **tại sao** phải dùng BigQuery Billing Export, và hướng dẫn setup đầy đủ.

---

## ❓ Tại sao không lấy được bill Google qua API?

### Vấn đề

Azure có `Azure Cost Management API` → gọi trực tiếp, trả về cost data ngay.  
Google **không có API tương đương** nào expose actual cost data.

### Điều tra thực tế (2026-03-31)

Đã test toàn bộ Google Cloud APIs với Service Account `studio-key@wecare-ai-studio.iam.gserviceaccount.com` (roles: `Billing Account Viewer` + `Billing Account Costs Manager`):

| API | HTTP | Kết quả | Ghi chú |
|---|---|---|---|
| **Budget API v1** `billingbudgets.googleapis.com/v1/budgets` | 200 ✅ | Trả về budget object | Chỉ có **budget cap** (số giới hạn tự đặt), **không có actual spend** |
| **Budget API v1beta1** `billingbudgets.googleapis.com/v1beta1/budgets` | Timeout | Không có data | v1beta1 có field `status.currentSpend` nhưng bị blocked/timeout |
| **Invoice API** `cloudbilling.googleapis.com/v1/invoices` | 404 ❌ | Endpoint không tồn tại | Google không expose invoice qua REST API công khai |
| **Cloud Billing Reports alpha** `cloudbillingreports.googleapis.com/v1alpha` | 404 ❌ | Endpoint không tồn tại | API alpha này không available |
| **Cloud Billing SKU catalog** `cloudbilling.googleapis.com/v1/services` | 200 ✅ | Danh sách dịch vụ + giá | Chỉ là **price catalog**, không có usage/cost thực tế |
| **Recommender API (Cost Insights)** `recommender.googleapis.com/v1` | 403 ❌ | API chưa enable | Cần enable thêm, và chỉ có recommendations, không phải raw cost |

### Root cause

**Google tách biệt hoàn toàn billing data** ra khỏi REST API công khai. Đây là quyết định thiết kế có chủ ý:

> Google Cloud Billing API (`cloudbilling.googleapis.com`) chỉ quản lý **cấu hình billing** (link project vào billing account, xem thông tin account) — **không expose cost/usage data**.

Để lấy cost data, Google yêu cầu **export ra BigQuery** trước, sau đó query BigQuery. Không có shortcut nào khác.

### Lý do nhầm lẫn ban đầu (Budget API)

Ghi chú cũ trong PROJECT.md viết:
> *"⏳ Budget tạo xong, chờ Google fill `currentSpend` (~24h)"*

→ **SAI**. Budget API v1 **không có field `currentSpend`**. Người viết nhầm giữa docs v1beta1 (có field này nhưng restricted) và v1 đang dùng. Đã đính chính trong PROJECT.md.

---

## ✅ Tại sao phải dùng BigQuery Billing Export?

BigQuery Billing Export là **cách chính thức duy nhất** Google hỗ trợ để lấy actual cost data qua API:

```
GCP Internal Billing System
        ↓ (Google stream tự động mỗi ngày)
  BigQuery Dataset (billing_export)
        ↓ (SA query qua BigQuery REST API)
  fetch-and-build.js → data.json → Dashboard
```

**Ưu điểm sau khi setup:**
- Cost breakdown theo từng service (`Google Workspace`, `Gemini API`, `Cloud Run`...)
- Lịch sử theo tháng (`byMonth`)
- Không cần update tay mỗi tháng
- GitHub Actions tự chạy hàng ngày lúc 7h ICT

**Nhược điểm:**
- Cần enable 1 lần trong GCP Console (không có API công khai để tự động hóa bước này)
- Chờ 24–48h sau khi enable để có data
- Chỉ có data từ ngày enable trở đi (không backfill tháng trước)

---

## 📋 Trạng thái hiện tại (2026-03-31)

| Thành phần | Trạng thái |
|---|---|
| SA `studio-key` + roles Billing Account | ✅ Đã có — `Billing Account Viewer` + `Billing Account Costs Manager` |
| Code `fetchGoogleBigQuery()` trong `fetch-and-build.js` | ✅ Đã viết — BigQuery-first strategy |
| Script test `scripts/test-gcp-bigquery.js` | ✅ Đã viết |
| GitHub Actions workflow có `GCP_BQ_DATASET`, `GCP_BQ_TABLE` | ✅ Đã thêm vào `.github/workflows/build-report.yml` |
| `.env` có `GCP_BQ_DATASET`, `GCP_BQ_TABLE` | ✅ Đã thêm |
| BigQuery dataset `billing_export` tạo trong GCP | 🔲 **Cần tạo** — xem Bước 1 |
| SA có quyền `BigQuery Data Viewer` + `BigQuery Job User` | 🔲 **Cần grant** — xem Bước 1 |
| Enable Billing Export trong GCP Console | 🔲 **Cần làm** — xem Bước 2 |
| GitHub Secrets `GCP_BQ_DATASET`, `GCP_BQ_TABLE` thêm vào repo | 🔲 **Cần thêm** — xem Bước 3 |
| Google data trên dashboard | ⚠️ Manual invoice — T03=$471.26, T01/T02=0 (đúng, không phải số giả) |

---

## ⚙️ Các bước cần làm (tất cả đều trong GCP Console — 1 lần duy nhất)

### 🔲 Bước 1 — Grant SA quyền BigQuery + Tạo dataset

> Làm bước này trước, dataset có thể tự tạo khi Enable Export ở Bước 2.

Vào: **https://console.cloud.google.com/iam-admin/iam?project=wecare-ai-studio**

1. Click **Grant access**
2. Principal: `studio-key@wecare-ai-studio.iam.gserviceaccount.com`
3. Thêm 2 roles:
   - `BigQuery Data Viewer` *(đọc data billing)*
   - `BigQuery Job User` *(chạy query)*
4. **Save**

---

### 🔲 Bước 2 — Enable Billing Export (bước quan trọng nhất)

> ❌ **Không có API để tự động hóa bước này.** Phải làm tay trong Console.

Vào: **https://console.cloud.google.com/billing/01E5FF-07AFF5-FD37C5/export**  
Yêu cầu quyền: **Billing Account Administrator**

1. Chọn tab **BigQuery export**
2. Click **Edit settings** ở mục **Detailed usage cost**
3. Điền:
   - **Project**: `wecare-ai-studio`
   - **Dataset**: `billing_export` *(Google tự tạo nếu chưa có)*
4. Click **Save**

> ⏳ Sau khi Save, Google stream data vào dataset trong **24–48h**.  
> Table tự động tạo tên: `gcp_billing_export_v1_01E5FF_07AFF5_FD37C5`

---

### 🔲 Bước 3 — Thêm GitHub Secrets

Vào: **https://github.com/wecare-i/-R-D---Billing-Management/settings/secrets/actions**

| Secret | Value |
|---|---|
| `GCP_BQ_DATASET` | `billing_export` |
| `GCP_BQ_TABLE` | `gcp_billing_export_v1_01E5FF_07AFF5_FD37C5` |

---

### ⏳ Bước 4 — Verify (chạy sau 24–48h kể từ Bước 2)

```bash
node scripts/test-gcp-bigquery.js
```

**Output mong đợi khi thành công:**
```
✅ Token OK
✅ Dataset: billing_export
✅ Table: gcp_billing_export_v1_01E5FF_07AFF5_FD37C5
📊 Querying latest billing data...
   Service                     Month     Cost USD
   Google Workspace            2026-03   $xxx.xx
   Gemini API                  2026-03   $xx.xx
   ...
✅ BigQuery Billing Export hoạt động! Chạy "npm run build" để update dashboard.
```

Sau khi verify OK → chạy `npm run build` → dashboard hiển thị data live thay cho manual-invoice.

---

## 🔄 Flow tự động (sau khi setup xong)

```
GitHub Actions (daily 7h ICT)
  └── fetch-and-build.js
        ├── 📊 Strategy 1: BigQuery Billing Export   ← primary (data thực tế theo service)
        ├── 📊 Strategy 2: Budget API                ← budget cap (optional)
        └── 📊 Strategy 3: manual-invoice            ← fallback (data.json giữ nguyên)
```

---

## 💡 Tên table BigQuery

Google tự sinh tên theo format:
```
gcp_billing_export_v1_{BILLING_ACCOUNT_ID_NORMALIZED}
```
`01E5FF-07AFF5-FD37C5` → `gcp_billing_export_v1_01E5FF_07AFF5_FD37C5`

Nếu tên khác → cập nhật `GCP_BQ_TABLE` trong `.env` và GitHub Secret.
