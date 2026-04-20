## Billing Management — Quản Lý Chi Phí & Thanh Toán

**Last Updated**: 2026-04-20  
**Last Reviewed**: 2026-04-20

> Quản lý thanh toán hàng tháng cho bộ phận Tech (R&D/Core): tạo phiếu bảng kê chi phí, điều tra bất thường, theo dõi billing từ Azure + Google + M365, và build Power BI dashboard tự động.

---

#### Mục tiêu
1. **Quản lý thanh toán**: Tạo và fill phiếu bảng kê chi phí hàng tháng cho bộ phận Tech (R&D/Core), gởi Kế toán duyệt thanh toán.
2. **Điều tra chi phí bất thường**: Khi phát hiện chi phí tăng đột biến → điều tra, phân tích tìm root cause, ghi nhận kết quả vào `02_analysis/notes/` để tái sử dụng.
3. **Tự động hóa**: Build Power BI dashboard kết nối trực tiếp Azure Cost Management + Google Cloud Billing API để theo dõi chi phí realtime.

---

#### Dịch vụ đang trả phí

| Vendor | Dịch vụ | Subscription ID | Chi phí ước tính/tháng | Ghi chú |
|---|---|---|---|---|
| **Microsoft** | Azure subscription 1 | `b230aef2-52a0-4800-8a8d-91a6880c86a2` | ~$1,160 | Cloud services chính |
| **Microsoft** | ACC Subscription (MACC) | `cc7e658b-6dcb-45b0-9646-71792cab759` | — | Azure Consumption Commitment |
| ~~**Microsoft**~~ | ~~M365 / Power Platform Licenses~~ | — | ~~$119~~ | ~~MOSA `wecare.com.vn`~~ — **ĐÃ HỦY, chuyển qua MCA** (2026-03-26) |
| **Google** | Google Workspace / Services | Billing `01E5FF-07AFF5-FD37C5` | ~$471 | Org: `wecare-i.com`, Paid account từ 11/02/2025 |

#### Billing Portals — Nơi kiểm tra hóa đơn

| Portal | URL | Chứa billing gì |
|---|---|---|
| **Azure Portal** | portal.azure.com → Cost Management + Billing | Azure consumption: VM, Storage, App Service, SQL... |
| **M365 Admin Center** | admin.microsoft.com → Billing → Bills & payments | Power Apps, Power Automate, M365 licenses, Dynamics 365 |
| **Google Cloud Console** | console.cloud.google.com → Billing | Google Workspace, GCP services |

> ⚠️ **Lưu ý**: Power Apps/Power Platform licenses **KHÔNG** nằm trong Azure billing → phải check ở M365 Admin Center.

---

#### Microsoft Billing Accounts (MCA)

| # | Billing Account | Billing Account ID | Chứa gì |
|---|---|---|---|
| 1 | **Wecare Group Joint Stock Company** | `0e0c45d9-ca8d-5a38-3a11-2e028a0d4f39:4dd47361-7ed3-47bb-b66a-a868713759b6_2019-05-31` | MACC (Azure Consumption Commitment) |
| 2 | **Công ty cổ phần Wecare Group** | `0e0c45d9-ca8d-5a88-3a11-2e028a0d4f39:0dd97e735-6a3b-4be8-b02a-72f02dbad05b_2019-05-31` | Azure consumption — 13 invoices |

#### Azure Billing Profiles

| # | Billing Profile ID | Billing Profile |
|---|---|---|
| 1 | `K7JM-MPGE-BG7-PGB` | Công ty cổ phần Wecare Group |
| 2 | `FEN6-Y2IZ-BG7-PGB` | (profile 2) |

> Power BI: dùng **Azure Cost Management connector** (built-in) → Choose Scope = `Billing Profile Id` → nhập ID ở trên.

---

#### Tổng hợp billing T03/2026 (all sources)

| Source | Account | Số tiền | Biling ID/Invoice | Thẻ | Loại phiếu |
|---|---|---|---|---|---|
| Azure consumption | Công ty cổ phần Wecare Group | **$1,276.98** | `G145113496` | MC ****6249 (cty) | Bảng kê chi phí |
| Google Workspace | `wecare-i.com` | **$565.44** *(T02: $471.26)* | ID: `3778-3513-4900` | Visa ****6073 (Khôi) | ĐNTT hoàn tiền |
| Google Cloud | `01E5FF-07AFF5-FD37C5` | **5,151,008 VNĐ** *(T02: 1,203,971)* | ID: `2459-2740-9153` | Visa ****6073 (Khôi) | ĐNTT hoàn tiền |
| M365 / Power Platform | MCA `Wecare Group JSC` | **$140.55** | `G148482179` | Thẻ Khôi | ĐNTT hoàn tiền |

> 💡 **NOTE**: Chi phí Google đã được phân rõ thành 2 luồng: 
> 1) Workspace tính bằng USD (Invoice `5531667040` - T03) 
> 2) GCP tính bằng VNĐ (Invoice `5536399878` - T03).

> 💡 M365 license cost cập nhật từ [License_Report_2026-03.md](file:///d:/_Antigravity/03_Personal/Billing%20Management/License_Report_2026-03.md): Power Apps ×3 ($60) + M365 Business Premium ×2 ($44) + Power Automate ×1 ($15) = **$119/tháng**.

---

#### M365 License Issues (từ License Report T03/2026)

| # | Issue | Severity | Action |
|---|---|---|---|
| 1 | `O365_BUSINESS_PREMIUM` over-assigned (2/1) | 🔴 High | Mua thêm seat hoặc unassign 1 user |
| 2 | `VIRTUAL_AGENT_USL` suspended nhưng 6 users assigned | 🟡 Medium | Unassign all users |
| 3 | `Microsoft_365_Copilot` suspended nhưng 1 user assigned | 🟡 Medium | Unassign user |
| 4 | `Microsoft_Teams_Exploratory_Dept` full 27/27 | 🟡 Medium | Sắp hết, cần upgrade hoặc mua thêm |

> Chi tiết: xem [License_Report_2026-03.md](file:///d:/_Antigravity/03_Personal/Billing%20Management/License_Report_2026-03.md)

---

#### Tech Stack
- **React Dashboard** (`dashboard/`) — Vite + React + TypeScript + Tailwind CSS + Chart.js
  - Deploy: GitHub Pages (auto via GitHub Actions)
  - Data: `scripts/fetch-and-build.js` → `dashboard/public/data.json` (server-side fetch, zero-auth client)
  - URL: `https://wecare-i.github.io/-R-D---Billing-Management/`
- **Power BI Desktop** — dashboard report
  - Built-in **Azure Cost Management connector** (2 Billing Profiles: `K7JM-MPGE-BG7-PGB`, `FEN6-Y2IZ-BG7-PGB`)
  - Tables loaded: Usage details, Budgets, Balance summary, Charges (bỏ RI tables)
  - DAX Measures — KPIs, trends, drill-down → xem [DAX_Measures.dax](file:///d:/_Antigravity/03_Personal/Billing%20Management/03_outputs/powerbi/DAX_Measures.dax)
- **Python** — `openpyxl` script fill bảng kê chi phí Excel
- **Node.js** — `scripts/fetch-and-build.js` fetch Azure + Google + M365 data, generate `data.json`
- **Azure Cost MCP** — query Azure cost data trực tiếp từ Antigravity
- **Google Cloud Billing API** — lấy Google billing data tự động
- **GitHub Actions** — `.github/workflows/build-report.yml` — auto fetch + build + deploy dashboard

#### Azure Cost Management — Bảng dữ liệu trong Power BI

| Bảng | Mô tả | Dùng |
|---|---|---|
| **All Usage** | Bảng tự tạo (Append `Usage details` + `Usage details (2)`), chứa tất cả data usage | ✅ **Dùng chính** |
| **Balance summary** | Tóm tắt số dư tài khoản, tổng credits, tổng chi tiêu tháng hiện tại | ❌ |
| **Billing events** | Lịch sử giao dịch: hóa đơn, thanh toán, charges | ⚠️ Tra cứu hóa đơn |
| **Charges / Charges (2)** | Chi phí tổng hợp theo billing period (scope 1 & 2) | ❌ (đã merge) |
| **Credit lots** | Credit Azure còn lại, hạn sử dụng | ❌ |
| **Usage details / Usage details (2)** | Chi tiết từng dòng usage hàng ngày (scope 1: Azure, scope 2: M365) | ❌ (đã merge vào All Usage) |
| **Usage details amortized / (2)** | Giống Usage details nhưng phân bổ đều chi phí Reserved Instances theo ngày | ⚠️ Dùng nếu có RI |

> **Phân biệt data**: Dùng `billingProfileId` để tách Azure (`FEN6-Y2IZ-BG7-PGB`) vs M365 (`K7JM-MPGE-BG7-PGB`). Cột `consumedService` phân loại Azure services (Fabric, Compute, Storage...), cột `productOrderName` phân loại M365 licenses.

#### API Connections — Lấy Data Tự Động

| Vendor | API | Auth | Service Principal / SA | Status |
|---|---|---|---|---|
| **Azure** | Azure Cost Management API | Service Principal (OAuth) | `Admin_WECARE` (`68e90e4b-610c-4657-9d59-4d789853103f`) | ✅ Hoạt động — role `Cost Management Reader` |
| **Google** | BigQuery Billing Export | Service Account (JSON key) | `studio-key@wecare-ai-studio.iam.gserviceaccount.com` | ⏳ Pending setup — hiện dùng **manual-invoice** (T03=$471.26). Xem [setup guide](02_analysis/notes/bigquery-billing-export-setup.md) |

**Google Cloud Billing — Chi tiết kết nối & trạng thái (2026-03-31):**

| Thông tin | Giá trị |
|---|---|
| Billing Account ID | `01E5FF-07AFF5-FD37C5` |
| Organization | `wecare-i.com` |
| Service Account | `studio-key@wecare-ai-studio.iam.gserviceaccount.com` |
| Client ID | `109523826902655221841` |
| Key file | `gcp-sa-key.json` (gitignored) |
| Projects linked | `Project-2025` (`project-2025-449801`), `Wecare AI Studio` (`wecare-ai-studio`) |
| Roles hiện có | `Billing Account Viewer` + `Billing Account Costs Manager` |
| Budget (monitoring only) | `Wecare Monthly Budget` (ID: `33d7109e-e26b-4515-af5e-c468b9633719`) |

**Kết quả điều tra API (2026-03-31):**

| API | Kết quả | Ghi chú |
|---|---|---|
| Budget API v1 `billingbudgets.googleapis.com` | ✅ 200 — budget info | ❌ **KHÔNG có `currentSpend`** — chỉ có budget cap. Ghi chú cũ "chờ 24h" là **SAI** |
| Invoice API `cloudbilling.googleapis.com/v1/invoices` | ❌ 404 | Endpoint không tồn tại |
| Cloud Billing Reports alpha | ❌ 404 | Không tồn tại |
| BigQuery Billing Export | ✅ Hoạt động sau khi enable | **Cách duy nhất** lấy actual cost data qua API |

> ⚠️ Kết luận: **Google không có REST API nào expose actual cost** nếu không qua BigQuery Export — khác hoàn toàn với Azure Cost Management API.
> Key file `gcp-sa-key.json` nằm ở root folder — **KHÔNG commit lên git** (đã gitignored).

#### Browser API (Billing_Report.html) — Yêu cầu bổ sung

> ⚠️ **Service Principal key KHÔNG dùng được từ browser** (Azure chặn CORS cho client_credentials flow). HTML report dùng **MSAL.js redirect flow** → đăng nhập bằng account user.

**Setup để chạy live API từ browser:**

| # | Thao tác | Chi tiết | 1 lần? |
|---|---|---|---|
| 1 | **Gán role** `Cost Management Reader` cho user | Azure Portal → Subscriptions → `b230aef2...` → IAM → Add role assignment | ✅ |
| 2 | **Thêm SPA redirect URI** vào App Registration | Entra ID → App registrations → `Admin_WECARE` → Authentication → Add SPA → `http://localhost:5500/Billing_Report.html` | ✅ |
| 3 | **Mở qua Live Server** (VS Code) hoặc HTTP server | Chuột phải file → Open with Live Server | Mỗi lần |

> 💡 Lần đầu mở trang sẽ redirect sang Azure login. Sau đó token cache trong localStorage — mở lại **không cần đăng nhập lại**.
>
> **Google Cloud Billing**: Không có REST API nào expose actual cost (kể cả server-side) nếu không setup BigQuery Billing Export. Hiện dùng **manual-invoice** — cập nhật `data.json` thủ công sau khi có invoice từ GCP Console mỗi tháng.

---

#### Quy trình hoạt động

```
CSV mẫu (template) → Antigravity đọc + fill data → Script ghi vào Excel → Gởi KT
```

1. **Anh đưa CSV mẫu** + thông tin chi phí cần fill
2. **Antigravity đọc CSV** (instant) → fill data vào
3. **Script `fill_expense.py`** ghi data vào file Excel mới
4. **Output**: `Tech_Bảng kê chi phí_T{MM}.{YYYY}.xlsx` trong `03_outputs/`
5. Anh lấy file output gởi Kế toán ✅

Chi tiết workflow: xem [WORKFLOW.md](file:///d:/_Antigravity/03_Personal/Billing%20Management/WORKFLOW.md)

---

#### Cấu trúc thư mục

```
Billing Management/
├── dashboard/              # 🚀 React Dashboard (Vite + React + TS + Tailwind)
│   ├── src/
│   │   ├── app/            # Entry: App.tsx
│   │   ├── features/billing/
│   │   │   ├── components/ # KpiStrip, BreakdownCards, Charts, ResourceBars, FilterBar
│   │   │   ├── hooks/      # useBillingData, useFilters
│   │   │   └── types/      # BillingData, MonthlyData, etc.
│   │   ├── shared/utils/   # formatters (usd, usdShort)
│   │   └── styles/         # globals.css (Wecare dark theme)
│   ├── public/data.json    # Generated by fetch-and-build.js
│   └── vite.config.ts
├── scripts/
│   ├── fetch-and-build.js  # Node.js — fetch Azure+Google+M365 → data.json
│   └── fill_expense.py     # Python — fill bảng kê chi phí Excel
├── .github/workflows/
│   └── build-report.yml    # GitHub Actions — auto fetch + build + deploy
├── 01_inputs/templates/              # Template gốc — KHÔNG SỬA
├── 01_inputs/invoices/               # Hóa đơn, invoice gốc (gitignored)
├── 03_outputs/                 # File đã fill → gởi KT
│   └── powerbi/            # Power BI data package
├── 02_analysis/notes/              # Tài liệu tham khảo, kết quả điều tra
├── License_Report_2026-03.md
├── PROJECT.md
├── WORKFLOW.md
├── gcp-sa-key.json         # 🔒 GCP SA key (gitignored)
└── .gitignore
```

#### Naming Convention
```
# File output:
Tech_Bảng kê chi phí_T{tháng}.{năm}.xlsx

# Invoice files (trong 01_inputs/invoices/T{MM}.{YYYY}/):
{Service}_{InvoiceID}.pdf|htm
```

---

#### MS Support Case — MOSA to MCA Migration — ✅ RESOLVED

| Field | Value |
|---|---|
| **Ticket #** | `2603170030007503` |
| **Opened** | 2026-03-17 |
| **Resolved** | 2026-03-26 |
| **Resolution** | MOSA licenses đã hủy, chuyển hoàn toàn qua billing account MCA |
| **Full thread** | [MS_Support_Case_2603170030007503.md](file:///d:/_Antigravity/03_Personal/Billing%20Management/02_analysis/notes/MS_Support_Case_2603170030007503.md) |

**Kết quả thực hiện:**
- ✅ Step 1: Xác nhận roles — Global Admin + Billing Admin
- ✅ Step 2: ~~Đổi payment method~~ → Hủy luôn MOSA licenses
- ✅ Step 3: Chuyển hoàn toàn qua MCA — không cần mua lại (đã hủy MOSA)

---

#### Quy trình Thanh toán & Đàm phán Tài chính
_Lưu trữ các rủi ro hệ thống, chính sách thanh toán và biên bản chuẩn bị làm việc với Team Tài chính._

| Tài liệu | Link | Mục đích |
|---|---|---|
| **Q&A Checklist (Vũ khí đàm phán)** | [Finance_Meeting_QA_Checklist.md](file:///d:/_Antigravity/01_Workspace/Billing%20Management/02_analysis/notes/Finance_Meeting_QA_Checklist.md) | Bộ câu hỏi "đáp xoáy" (Forecast Buffer, ngoại tệ, rủi ro sập Server) dành cho Tech Lead |

---

#### Known Issues
- Thẻ cty MC ****6249 dùng chung Sale/Marketing → risk hết hạn mức khi billing cycle đến
- T01/2026 đã trừ thẻ Khôi ($362.11 Azure) → **cần xác nhận đã hoàn tiền chưa**
- ~~wecare.com.vn (MOSA) đang charge M365 licenses vào thẻ Khôi~~ → **ĐÃ HỦY MOSA** (2026-03-26)
- ~~`O365_BUSINESS_PREMIUM` over-assigned 2/1 seats~~ → MOSA đã hủy, không còn issue
- 6 users vẫn assigned trên `VIRTUAL_AGENT_USL` (suspended) → cần cleanup trên Admin Center
- 1 user vẫn assigned trên `Microsoft_365_Copilot` (suspended) → cần cleanup trên Admin Center

#### ⚠️ Cleanup Suspended Licenses

Cần thao tác trên **M365 Admin Center** → Users → Active users → chọn user → Licenses and apps → uncheck SKU.

| SKU | Users cần unassign | Cách tìm |
|---|---|---|
| `VIRTUAL_AGENT_USL` | 6 users | Admin Center → Billing → Licenses → filter "Copilot Studio" |
| `Microsoft_365_Copilot` | 1 user | Admin Center → Billing → Licenses → filter "Copilot" |

> 💡 Không ảnh hưởng service vì SKU đã suspended — chỉ cleanup cho sạch.

---

#### Roadmap

**✅ Đã xong:**
- [x] Setup cấu trúc thư mục (01_inputs/templates/, 01_inputs/invoices/, 03_outputs/, scripts/, _upload/)
- [x] Tạo WORKFLOW.md, PROJECT.md, fill_expense.py
- [x] Đưa file Excel + CSV template vào 01_inputs/templates/
- [x] Ghi nhận Microsoft billing accounts + IDs
- [x] Xử lý invoice upload T02 + T03 (Azure + Google)
- [x] Điều tra Gemini API cost spike T03/2026 → `02_analysis/notes/gemini_api_audit.md`
- [x] Gửi ticket MS Support MOSA → MCA migration (#2603170030007503)
- [x] Tổng hợp toàn bộ email thread MS Support → `02_analysis/notes/MS_Support_Case_2603170030007503.md`
- [x] Azure Cost MCP hoạt động (2026-03-24)
- [x] Setup Google Cloud Billing API — SA + role assigned (2026-03-25)
- [x] Bổ sung API Reference + Power BI data package vào `03_outputs/powerbi/` (2026-03-25)
- [x] Setup Power BI Azure Cost Management connector (2026-03-25)
- [x] License audit T03/2026 → `License_Report_2026-03.md` — $119/tháng (2026-03-17)
- [x] **HỦY MOSA licenses** — chuyển hoàn toàn qua MCA billing account (2026-03-26)
- [x] **Build React Dashboard** — Vite + React + TypeScript + Tailwind + Chart.js (2026-03-27)
  - Interactive filters (Month dropdown + Vendor toggle)
  - Drill-down charts (Bar + Pie react theo vendor → sub-items)
  - KPI strip, Breakdown cards, Resource bars — hover effects
  - Multi-vendor support: Azure services, Google Workspace/AI Studio, M365 licenses
  - GitHub Pages deploy via Actions workflow
- [x] **Migrate deploy** — từ static HTML sang React dashboard trên GitHub Pages (2026-03-27)
- [x] **Tối ưu Dashboard & Data Pipeline** (2026-03-28)
  - Fix lỗi `ReferenceError: now is not defined` gây crash script Node.js.
  - Loại bỏ hoàn toàn data ảo (hardcoded ~$471) của Google Cloud, kích hoạt cảnh báo "Chưa có data từ Google API / Setup Budget" cho tới khi thực sự cấu hình Budget.
  - Refactor data model của Google thành mảng động (`data.google.items`) để sẵn sàng rải (drill-down) data dịch vụ thật nếu đấu nối BigQuery sau này.
  - Sửa logic biểu đồ Daily Cost: Tự động ẩn biểu đồ đường day-by-day (hiển thị chú thích cảnh báo) khi chọn các Vendor tính phí Subscription phẳng (Google/M365) để tránh gây hiểu lầm. Đồng thời Title tự động cập nhật linh hoạt theo tháng được chọn.
  - Cân đối tỷ lệ dữ liệu (Scale Proportional) cho M365 Card ở cả 3 tháng lịch sử (T01, T02, T03) thay vì clone số liệu của tháng hiện tại xuống.
  - Căn lề trái thẩm mỹ cho `ResourceBars` của Azure, thêm thuộc tính tooltip đọc Full name các Server bị dài.
- [x] **Điều tra Google Billing API** (2026-03-28 → 2026-03-31)
  - Tạo budget `Wecare Monthly Budget` (ID: `33d7109e-e26b-4515-af5e-c468b9633719`) — dùng cho monitoring alert, không lấy cost data được
  - ❌ Budget API v1: **không có `currentSpend`** — ghi chú "chờ 24h" trong phiên bản cũ là SAI, đã đính chính
  - ❌ Invoice API, Cloud Billing Reports: endpoint không tồn tại (404)
  - ✅ Kết luận: BigQuery Billing Export là cách duy nhất → code đã viết sẵn, pending enable trong GCP Console
- [x] **Điền Google data T03/2026 vào dashboard** (2026-03-31)
  - `data.json`: T03 Google = $471.26 (từ invoice thực), T01/T02 = 0 (không có invoice)
  - `google.items = []` — chờ BigQuery để có breakdown theo dịch vụ
  - Source badge: "📄 Manual Invoice" — transparent với người xem

**🔥 Ưu tiên cao — Làm tiếp:**
- [x] **Setup Google BigQuery Billing Export code** — `fetch-and-build.js` BigQuery-first strategy (2026-03-31)
  - `fetchGoogleBigQuery()`: query `billing_export` dataset → cost breakdown by service + month
  - Graceful fallback: BigQuery → Budget API cap → manual-invoice
  - Test script: `node scripts/test-gcp-bigquery.js`
  - Setup guide: `02_analysis/notes/bigquery-billing-export-setup.md`
- [ ] **⏳ Enable BigQuery Billing Export trong GCP Console** — xem `02_analysis/notes/bigquery-billing-export-setup.md`
  - [ ] Enable export: Billing → BigQuery export → project `wecare-ai-studio` → dataset `billing_export`
  - [ ] Grant SA: `studio-key@wecare-ai-studio.iam.gserviceaccount.com` roles `BigQuery Data Viewer` + `BigQuery Job User`
  - [ ] Add GitHub Secrets: `GCP_BQ_DATASET`, `GCP_BQ_TABLE`
  - [ ] Verify sau 24-48h: `node scripts/test-gcp-bigquery.js`
- [ ] **Fill bảng kê chi phí T03/2026** — chờ hết tháng, lấy invoice chính thức
- [ ] **Cleanup suspended licenses** — unassign 7 users (VIRTUAL_AGENT_USL + Copilot) trên Admin Center


**📋 Nhắc nhở (low priority):**
- [ ] Lập ĐNTT hoàn tiền T03 cho Khôi — Google $471.26 + M365 $119
- [ ] T01/2026 Azure $362.11 trừ thẻ Khôi — đã hoàn tiền chưa?

**🚀 Dashboard Roadmap — Power BI Billing Dashboard**

> **Mục tiêu**: Build Power BI dashboard để team R&D theo dõi chi phí cloud realtime, phát hiện bất thường, và lập kế hoạch ngân sách.
> **Tool**: Power BI Desktop + Azure Cost Management connector (built-in) + Google Cloud Billing API

**Phase 1 — Azure Dashboard (ưu tiên) `03_outputs/powerbi/`**
- [ ] **KPI Strip (highlight numbers)**:
  - Total Spend MTD (so sánh vs tháng trước)
  - Forecast End-of-Month (dự báo)
  - Budget Remaining (% đã dùng)
  - Top Service Cost (dịch vụ tốn nhất)
  - MoM Change % (tăng/giảm so tháng trước)
- [ ] **Charts**:
  - 📊 Daily Cost Trend (line chart) — theo dõi spending pattern theo ngày
  - 📊 Cost by Service (bar chart) — Fabric, VMs, Storage, VNet, Bandwidth
  - 📊 Cost by Resource Group (treemap) — wecare, hr, ecommerce, ai-dev
  - 📊 Top 10 Resources (horizontal bar) — resource nào tốn nhất
  - 📊 Month-over-Month Comparison (clustered bar) — so sánh 3-6 tháng gần nhất
- [ ] **Insights**:
  - ⚠️ Anomaly detection — highlight ngày có cost spike > 20% trung bình
  - 💡 Idle resource detection — VM/disk chạy nhưng cost thấp bất thường
  - 📈 Forecast trendline — dự báo cost cuối tháng dựa trên pattern hiện tại
- [ ] **Data source**: Azure Cost Management connector → Billing Profile `K7JM-MPGE-BG7-PGB`
- [ ] **DAX Measures**: xem [DAX_Measures.dax](file:///d:/_Antigravity/03_Personal/Billing%20Management/03_outputs/powerbi/DAX_Measures.dax)

**Phase 2 — Google Cloud Billing**
- [ ] Build MCP Google Billing cost (dùng `studio-key` SA)
- [ ] Setup BigQuery export → Power BI BigQuery connector
- [ ] Thêm page Google cost vào cùng report — so sánh Azure vs Google
- [ ] Charts: Google cost by project, by service, monthly trend

**Phase 3 — Publish & Automate**
- [ ] Publish lên Power BI Service → share team R&D
- [ ] Schedule refresh (daily) cho Azure + Google data
- [ ] Setup alerts: notify khi cost vượt ngưỡng budget
- [ ] Theo dõi hạn mức thẻ cty hàng tháng
- [ ] Tự động hóa fill bảng kê — Antigravity trigger hàng tháng

---

#### Quyết Định Thiết Kế

- **Power BI Desktop + built-in connector**: dùng Azure Cost Management connector có sẵn trong Power BI thay vì tự build REST API → ít maintenance, auto-refresh, Microsoft supported.
- **Dùng openpyxl ghi trực tiếp vào Excel template** thay vì export CSV rồi convert: vì template có merged cells phức tạp (27 sheets), cần giữ format gốc.
- **Gitignore 01_inputs/invoices/ và 03_outputs/*.xlsx**: chứa thông tin billing nhạy cảm, không commit lên repo.
- **Tách MS Support email thread ra `02_analysis/notes/`**: giữ full context để tra cứu, không gom vào PROJECT.md.
- **Power BI data package (`03_outputs/powerbi/`)**: chứa sample data + DAX measures + theme — portable, ai clone repo cũng setup được Power BI report.
- **Không dùng Microsoft Graph API cho billing**: Graph API không expose billing/cost data → dùng Azure Cost Management API (REST) + M365 Admin Center manual.
- **Hủy MOSA thay vì migrate**: MS Support xác nhận không có cách transfer trực tiếp MOSA → MCA → quyết định hủy MOSA và chuyển hẳn qua MCA (2026-03-26).
