# 🔗 Google BigQuery Billing Export — Setup Guide

## Mục tiêu
Kết nối Google Cloud Billing Export vào BigQuery để `fetch-and-build.js` tự động lấy chi phí thực tế thay vì hardcode từ invoice.

**Sau khi setup xong**: chạy `node scripts/test-gcp-bigquery.js` để verify.

---

## Bước 1 — Enable Billing Export (GCP Console)

> ⚠️ **Chỉ làm 1 lần.** Yêu cầu quyền **Billing Account Administrator**.

1. Vào: **https://console.cloud.google.com/billing/01E5FF-07AFF5-FD37C5/export**
2. Chọn tab **BigQuery export**
3. Click **Edit settings** ở mục **Detailed usage cost**
4. Điền:
   - **Project**: `wecare-ai-studio`
   - **Dataset**: `billing_export` ← tạo mới nếu chưa có
5. Click **Save**

> ⏳ **Chờ 24–48h** để Google populate data. Chỉ có data từ ngày enable trở đi.  
> Table tự động tạo với tên: `gcp_billing_export_v1_01E5FF_07AFF5_FD37C5`

---

## Bước 2 — Grant SA quyền BigQuery (GCP Console)

Service Account cần 2 roles trên project `wecare-ai-studio`:

| Role | Tại đâu |
|---|---|
| `BigQuery Data Viewer` | IAM → project level hoặc dataset level |
| `BigQuery Job User` | IAM → project level |

**Cách grant:**

1. Vào: **https://console.cloud.google.com/iam-admin/iam?project=wecare-ai-studio**
2. Click **Grant access**
3. Principal: `studio-key@wecare-ai-studio.iam.gserviceaccount.com`
4. Roles: thêm 2 roles trên → **Save**

**Hoặc grant ở dataset level** (more restrictive, recommended):
1. Vào BigQuery Studio: **https://console.cloud.google.com/bigquery?project=wecare-ai-studio**
2. Chọn dataset `billing_export` → **Sharing** → **Permissions**
3. Add principal: `studio-key@wecare-ai-studio.iam.gserviceaccount.com` → role `BigQuery Data Viewer`
4. Vẫn cần grant `BigQuery Job User` ở project level (step trên)

---

## Bước 3 — Thêm GitHub Secrets

Vào: **https://github.com/wecare-i/-R-D---Billing-Management/settings/secrets/actions**

Thêm 2 secrets:

| Secret | Value |
|---|---|
| `GCP_BQ_DATASET` | `billing_export` |
| `GCP_BQ_TABLE` | `gcp_billing_export_v1_01E5FF_07AFF5_FD37C5` |

---

## Bước 4 — Verify (chạy sau 24-48h)

```bash
node scripts/test-gcp-bigquery.js
```

**Output mong đợi:**
```
✅ Token OK
✅ Dataset: billing_export
✅ Table: gcp_billing_export_v1_01E5FF_07AFF5_FD37C5
📊 Querying latest billing data...
   Service                          Month     Cost USD
   Google Workspace Business Plus   2026-03   $312.48
   Gemini API                       2026-03   $52.18
   ...
✅ BigQuery Billing Export hoạt động!
```

Sau khi verify OK → chạy `npm run build` để update dashboard với data live.

---

## Flow tự động (sau setup)

```
GitHub Actions (daily 7h ICT)
  └── fetch-and-build.js
        ├── 📊 BigQuery Billing Export → items breakdown thực tế + byMonth
        ├── 📊 Budget API → budget cap (optional)
        └── Fallback: manual-invoice (data.json giữ nguyên nếu BQ chưa ready)
```

---

## Tên table BigQuery

Google tự tạo table theo format:
```
gcp_billing_export_v1_{BILLING_ACCOUNT_ID_NORMALIZED}
```
Billing account `01E5FF-07AFF5-FD37C5` → table: `gcp_billing_export_v1_01E5FF_07AFF5_FD37C5`

Nếu tên khác → cập nhật `GCP_BQ_TABLE` trong `.env` và GitHub Secret.
