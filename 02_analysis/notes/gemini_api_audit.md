# Gemini API Cost Audit — 18/03/2026

> **Conversation**: `7a8355e6-12df-42c1-a123-7069d6938814`
> **Related**: Billing Account Consolidation (`c8a7183d-44e7-4d1a-a34b-43c09085cba4`)
> **Project**: Billing Management — Google Cloud cost tracking & API key audit

---

## Bối cảnh

- Google Cloud project **Wecare AI Studio** (`wecare-ai-studio`) dùng Gemini API
- Chi phí tháng 03/2026 tăng bất thường → cần xác định API key/app nào tiêu tốn nhiều nhất
- **~100 API keys** tạo từ Google AI Studio, tất cả tên giống nhau: `Generative Language API Key`
- Billing account: **My Billing Account** (`01E5FF-07AFF5-FD37C5`)

---

## Chi phí Google Cloud

### So sánh 2 tháng:

| Project | Tháng trước | Tháng này | Trend |
|---|---|---|---|
| **Wecare AI Studio** | ₫609,668 | **₫1,200,000** | ⬆️ 97% |
| **Project BigQuery** | ~₫500,000 | ~₫500,000 | → |
| **Tổng** | ~₫1,100,000 | **~₫1,700,000** | ⬆️ 55% |

### Breakdown SKU tháng 03/2026 (AI Studio):

| SKU | Cost (VNĐ) | Usage | Trend |
|---|---|---|---|
| Gemini 2.5 Flash output tokens | ₫807,672 | 12.3M count | ⬆️ 462% |
| Gemini 3 Pro input (short) | ₫119,856 | 2.3M count | 🆕 New |
| Gemini 3 Pro input (long) | ₫111,486 | 1.07M count | 🆕 New |
| Gemini 3 Pro cached input | ₫85,630 | 16.4M count | 🆕 New |
| Gemini Embedding 1 | ~₫75,000 | 11 requests | - |

### Cloud Run Services (us-west1):

| Service | Cost | Deployed by | Ghi chú |
|---|---|---|---|
| **marketing-app** | **₫227,273** | hochitrung0801... | Tốn nhất |
| supplier-invoice-matching-tool | ₫17,202 | compute@developer | Active 0.03 req/s |
| power-apps-trial-extension-guide | ₫5,820 | tien.tran@ | |
| wecare-facebook-* (3 services) | ~₫7,600 | habongn001@ | |
| payment-review-system | ₫164 | compute@developer | asia-southeast1 |

---

## Quá trình điều tra API Key

### Các phương pháp đã thử:

| # | Phương pháp | Kết quả |
|---|---|---|
| 1 | APIs & Services → Metrics | Thấy methods, **không filter per key** |
| 2 | Billing Reports → Group by | Có SKU/Project/Application, **không có Credential** |
| 3 | APIs & Services → Credentials | List 100 keys cùng tên, **không có metrics** |
| 4 | Cloud Logging → Logs Explorer | **0 results** — Audit Logs chưa bật |
| 5 | IAM & Admin → Audit Logs | Generative Language API **không có trong danh sách** |
| 6 | **Cloud Monitoring → Metrics Explorer** | ✅ **THÀNH CÔNG** |

### Kết quả (Metrics Explorer):

Metric: `Consumed API → Request count`, Group by: `credential_id`

| Credential ID | Service | Peak Rate | Spike |
|---|---|---|---|
| `apikey:29f182cb-fb1b-4786-a1ec-98c68ae9be1b` | generativelanguage | **0.0613/s** (~5,300 req/ngày) | 13/03 |
| `apikey:4201289d-00e2-4092-9ecf-8f9ae5373977` | generativelanguage | Thấp hơn | - |

> [!IMPORTANT]
> **AI Studio + API Key = không track per key qua Billing hoặc Audit Logs.**
> Chỉ **Metrics Explorer** (group by `credential_id`) mới xác định được key nào gọi nhiều.

---

## Hạn chế của AI Studio API Keys

| Feature | AI Studio (API Key) | Vertex AI (Service Account) |
|---|---|---|
| Track per key/user | ❌ | ✅ |
| Audit Logs | ❌ | ✅ |
| Quota per key | ❌ | ✅ |
| Billing per key | ❌ | ✅ |

---

## Cloud Run Pricing (tham khảo)

| Loại | Giá | Free tier |
|---|---|---|
| **CPU** | $0.000024 / vCPU-giây | 180,000 vCPU-s/tháng |
| **Memory** | $0.0000025 / GiB-giây | 360,000 GiB-s/tháng |
| **Requests** | $0.40 / 1M requests | 2M requests/tháng |
| **Network Egress** | $0.12 / GB (> 1 GB) | 1 GB miễn phí |

---

## Action Items

| Priority | Action | Status |
|---|---|---|
| 🔴 | Tìm key `29f182cb` trong Credentials → xác định owner | ⬜ |
| 🔴 | Kiểm tra `marketing-app` (Cloud Run) có gọi Gemini API không | ⬜ |
| 🔴 | Set Budget Alert ₫1.5M/tháng cho project AI Studio | ⬜ |
| 🟡 | Bật Audit Logs (default config: Data Read + Data Write) | ⬜ |
| 🟡 | Thông báo team audit API keys — claim key đang dùng | ⬜ |
| 🟡 | Xóa keys cũ, đặt tên lại theo convention `[team]-[app]-[env]` | ⬜ |
| 🟢 | Cân nhắc migrate sang Vertex AI (audit log đầy đủ) | ⬜ |

---

## Useful Commands & URLs

```bash
# List tất cả API keys
gcloud services api-keys list --project=wecare-ai-studio --format="table(uid,displayName,createTime)"
```

| Trang | URL |
|---|---|
| Dashboard | `https://console.cloud.google.com/home/dashboard?project=wecare-ai-studio` |
| Billing Reports | `https://console.cloud.google.com/billing/reports?project=wecare-ai-studio` |
| Cloud Run | `https://console.cloud.google.com/run?project=wecare-ai-studio` |
| Credentials | `https://console.cloud.google.com/apis/credentials?project=wecare-ai-studio` |
| Metrics Explorer | `https://console.cloud.google.com/monitoring/metrics-explorer?project=wecare-ai-studio` |
