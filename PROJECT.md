## Billing Management — Quản Lý Chi Phí & Thanh Toán

#### Mục tiêu
1. **Quản lý thanh toán**: Tạo và fill phiếu bảng kê chi phí hàng tháng cho bộ phận Tech (R&D/Core), gởi Kế toán duyệt thanh toán.
2. **Điều tra chi phí bất thường**: Khi phát hiện chi phí tăng đột biến → điều tra, phân tích tìm root cause, ghi nhận kết quả vào `reference/` để tái sử dụng.

#### Dịch vụ đang trả phí

| Vendor | Dịch vụ | Subscription ID | Ghi chú |
|---|---|---|---|
| **Microsoft** | Azure subscription 1 | `b230aef2-52a0-4800-8a8d-91a6880c86a2` | Cloud services chính |
| **Microsoft** | ACC Subscription | `cc7e658b-6dcb-45b0-9646-71792cab759` | Azure Consumption Commitment (MACC) |
| **Microsoft** | Microsoft 365 / Power Platform | — | Licenses (MOSA `wecare.com.vn`) |
| **Google** | Google Workspace / Services | Billing Account `01E5FF-07AFF5-FD37C5` | Org: `wecare-i.com`, Paid account từ 11/02/2025 |

#### Billing Portals — Nơi kiểm tra hóa đơn

| Portal | URL | Chứa billing gì |
|---|---|---|
| **Azure Portal** | portal.azure.com → Cost Management + Billing | Azure consumption: VM, Storage, App Service, SQL... |
| **M365 Admin Center** | admin.microsoft.com → Billing → Bills & payments | Power Apps, Power Automate, M365 licenses, Dynamics 365 |
| **Google Cloud Console** | console.cloud.google.com → Billing | Google Workspace, GCP services |

> ⚠️ **Lưu ý**: Power Apps/Power Platform licenses **KHÔNG** nằm trong Azure billing → phải check ở M365 Admin Center.

#### Microsoft Billing Accounts (MCA)

| # | Billing Account | Billing Account ID | Chứa gì |
|---|---|---|---|
| 1 | **Wecare Group Joint Stock Company** | `0e0c45d9-ca8d-5a38-3a11-2e028a0d4f39:4dd47361-7ed3-47bb-b66a-a868713759b6_2019-05-31` | MACC (Azure Consumption Commitment) |
| 2 | **Công ty cổ phần Wecare Group** | `0e0c45d9-ca8d-5a88-3a11-2e028a0d4f39:0dd97e735-6a3b-4be8-b02a-72f02dbad05b_2019-05-31` | Azure consumption — 13 invoices |

#### Tổng hợp billing T03/2026 (all sources)

| Source | Account | Số tiền | Thẻ | Loại phiếu |
|---|---|---|---|---|
| Azure consumption | Công ty cổ phần Wecare Group | $1,160.87 | MC ****6249 (cty) | Bảng kê chi phí |
| Google Workspace | Google | $471.26 | Visa ****6073 (Khôi) | ĐNTT hoàn tiền |
| M365 licenses | wecare.com.vn | ~$121.00 | Thẻ Khôi | ĐNTT hoàn tiền |

#### Azure Billing Profiles

| # | Billing Profile ID | Billing Profile |
|---|---|---|
| 1 | `K7JM-MPGE-BG7-PGB` | Công ty cổ phần Wecare Group |
| 2 | `FEN6-Y2IZ-BG7-PGB` | (profile 2) |

> Power BI: dùng **Azure Cost Management connector** (built-in) → Choose Scope = `Billing Profile Id` → nhập ID ở trên.



#### Tech Stack
- **Power BI Desktop** — dashboard report
  - Built-in **Azure Cost Management connector** (2 Billing Profiles: `K7JM-MPGE-BG7-PGB`, `FEN6-Y2IZ-BG7-PGB`)
  - Tables loaded: Usage details, Budgets, Balance summary, Charges (bỏ RI tables)
  - DAX Measures — KPIs, trends, drill-down

#### API Connections — Lấy Data Tự Động

| Vendor | API | Auth | Service Principal / SA | Status |
|---|---|---|---|---|
| **Azure** | Azure Cost Management API | Service Principal (OAuth) | `Admin_WECARE` (`68e90e4b-610c-4657-9d59-4d789853103f`) | ✅ Hoạt động — role `Cost Management Reader` |
| **Google** | Cloud Billing API | Service Account (JSON key) | `studio-key@wecare-ai-studio.iam.gserviceaccount.com` | ✅ Đã setup — role `Billing Account Viewer` |

**Google Cloud Billing API — Chi tiết kết nối:**

| Thông tin | Giá trị |
|---|---|
| Billing Account ID | `01E5FF-07AFF5-FD37C5` |
| Organization | `wecare-i.com` |
| API Endpoint | `cloudbilling.googleapis.com` |
| Service Account | `studio-key@wecare-ai-studio.iam.gserviceaccount.com` |
| Client ID | `109523826902655221841` |
| Key file | `gcp-sa-key.json` (gitignored) |
| Projects linked | `Project-2025` (`project-2025-449801`), `Wecare AI Studio` (`wecare-ai-studio`) |
| Role | `Billing Account Viewer` |

> ⚠️ Key file `gcp-sa-key.json` nằm ở root folder — **KHÔNG commit lên git** (đã gitignored).

#### Quy trình hoạt động

```
CSV mẫu (template) → Antigravity đọc + fill data → Script ghi vào Excel → Gởi KT
```

1. **Anh đưa CSV mẫu** + thông tin chi phí cần fill
2. **Antigravity đọc CSV** (instant) → fill data vào
3. **Script `fill_expense.py`** ghi data vào file Excel mới
4. **Output**: `Tech_Bảng kê chi phí_T{MM}.{YYYY}.xlsx` trong `output/`
5. Anh lấy file output gởi Kế toán ✅

#### Cấu trúc thư mục

```
Billing Management/
├── templates/              # Template gốc — KHÔNG SỬA
│   ├── Bảng kê chi phí.csv
│   └── Bảng kê chi phí.xlsx
├── invoices/               # Hóa đơn, invoice gốc
│   ├── _upload/            # Anh bỏ file gốc vào đây → em đổi tên + move
│   ├── T03.2026/           # {Service}_{InvoiceID}.pdf
│   └── T04.2026/
├── output/                 # File đã fill → gởi KT
│   └── powerbi/            # Power BI data package + API reference
├── reference/              # Tài liệu tham khảo, kết quả điều tra chi phí
│   └── gemini_api_audit.md # Điều tra Gemini API cost spike T03/2026
├── scripts/
│   └── fill_expense.py
├── PROJECT.md
└── WORKFLOW.md
```

#### Naming Convention
```
Tech_Bảng kê chi phí_T{tháng}.{năm}.xlsx
```



#### Known Issues
- Thẻ cty dùng chung Sale/Marketing → risk hết hạn mức khi billing cycle đến
- T01/2026 đã trừ thẻ Khôi ($362.11 Azure) → cần xác nhận đã hoàn tiền chưa
- wecare.com.vn (MOSA) đang charge M365 licenses vào thẻ Khôi → cần đổi thẻ hoặc migrate

#### MS Support Case — MOSA to MCA Migration

| Field | Value |
|---|---|
| **Ticket #** | `2603170030007503` |
| **Opened** | 2026-03-17 |
| **Status** | Agent Assigned — Anthony A |
| **Email thread** | [Email_MS_Support_MOSA_to_MCA.md](file:///d:/_Antigravity/03_Personal/Billing%20Management/output/Email_MS_Support_MOSA_to_MCA.md) |

**MS Support hướng dẫn 3 bước:**
1. Xác nhận roles (Billing Admin cho MOSA, Owner/Contributor cho MCA)
2. Đổi payment method MOSA → thêm MC ****6249 → replace thẻ Khôi
3. Consolidate: mua licenses trên MCA → move users → cancel MOSA

> ⚠️ Anthony đã gọi 18/03 nhưng rơi voicemail → cần **reply email** xác nhận vẫn cần hỗ trợ.

#### Roadmap

**✅ Đã xong:**
- [x] Setup cấu trúc thư mục (templates/, invoices/, output/, scripts/, _upload/)
- [x] Tạo WORKFLOW.md, PROJECT.md, fill_expense.py
- [x] Đưa file Excel + CSV template vào templates/
- [x] Ghi nhận 4 Microsoft billing accounts + IDs
- [x] Xử lý invoice upload T02 + T03 (Azure + Google)
- [x] Điều tra Gemini API cost spike T03/2026 → ghi nhận vào `reference/gemini_api_audit.md`
- [x] Gửi ticket MS Support MOSA → MCA migration (TrackingID#2603170030007503)
- [x] Tổng hợp phản hồi MS Support → `output/Email_MS_Support_MOSA_to_MCA.md`

**🔥 Ưu tiên cao — Làm tiếp:**
- [ ] **Reply Anthony** — xác nhận vẫn cần hỗ trợ, hỏi chi tiết Step 3
- [ ] **Bật Advanced Diagnostics** theo yêu cầu MS Support
- [ ] Đổi thẻ thanh toán wecare.com.vn: thẻ Khôi → thẻ cty MC ****6249 (Step 2 từ MS)
- [ ] Download lại Google receipt T03 ($471.26) → bỏ vào `_upload/` (file cũ bị mất do Windows long path)
- [ ] Fill bảng kê chi phí T03/2026 — Azure $1,160.87 (thẻ cty)
- [ ] Lập ĐNTT hoàn tiền T03 cho Khôi — Google $471.26 + M365 ~$121.00

**📋 Cần xác nhận:**
- [ ] T01/2026 Azure $362.11 trừ thẻ Khôi — đã hoàn tiền chưa?
- [ ] Xác nhận chi tiết từng khoản M365 license (download CSV từ wecare.com.vn)
- [ ] Lên plan chi tiết migrate MOSA → MCA (Step 3 từ MS Support)

**🔮 Tương lai:**
- [x] ~~Build MCP / Skill lấy billing data tự động từ Azure~~ → Azure Cost MCP hoạt động ✅ (2026-03-24)
- [x] Setup Google Cloud Billing API → Service account + role assigned ✅ (2026-03-25)
- [x] Bổ sung API Reference chi tiết (Azure, Google, M365) vào `output/powerbi/README.md` ✅ (2026-03-25)
- [x] Setup Power BI Azure Cost Management connector (Billing Profile `K7JM-MPGE-BG7-PGB`) ✅ (2026-03-25)
- [ ] Build MCP Google Billing cost (dùng `studio-key` SA)
- [ ] Setup BigQuery export cho Google Cloud → Power BI BigQuery connector
- [ ] Theo dõi hạn mức thẻ cty hàng tháng
- [ ] Power BI report → publish lên Power BI Service → share team R&D

