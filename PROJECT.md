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
| **Google** | Google Workspace / Services | — | (cần xác nhận chi tiết) |

#### Billing Portals — Nơi kiểm tra hóa đơn

| Portal | URL | Chứa billing gì |
|---|---|---|
| **Azure Portal** | portal.azure.com → Cost Management + Billing | Azure consumption: VM, Storage, App Service, SQL... |
| **M365 Admin Center** | admin.microsoft.com → Billing → Bills & payments | Power Apps, Power Automate, M365 licenses, Dynamics 365 |
| **Google Cloud Console** | console.cloud.google.com → Billing | Google Workspace, GCP services |

> ⚠️ **Lưu ý**: Power Apps/Power Platform licenses **KHÔNG** nằm trong Azure billing → phải check ở M365 Admin Center.

#### Microsoft Billing Accounts (MCA)

⚠️ Có **3 billing accounts** — phải check từng cái khi tổng hợp invoice:

| # | Billing Account | Billing Account ID | Chứa gì |
|---|---|---|---|
| 1 | **Wecare Group Joint Stock Company** | `0e0c45d9-ca8d-5a38-3a11-2e028a0d4f39:4dd47361-7ed3-47bb-b66a-a868713759b6_2019-05-31` | MACC (Azure Consumption Commitment) |
| 2 | **Công ty cổ phần Wecare Group** | `0e0c45d9-ca8d-5a88-3a11-2e028a0d4f39:0dd97e735-6a3b-4be8-b02a-72f02dbad05b_2019-05-31` | Azure consumption — 13 invoices |
| 3 | **Hieu Le** | `0e0c45d9-ca8d-5a38-3a11-2e028a0d4f39:d9083e54-b501-494a-8809-471fe8595737_2019-05-31` | Account cá nhân anh Hiếu |
| 4 | **wecare.com.vn** | (MOSA - legacy) | M365 licenses — ⚠️ **đang charge thẻ Khôi Trần** → cần ĐNTT |

> 📝 M365 Admin Center còn thêm 3 accounts khác (Tiền Trần, Quyen Le, Khoa Tran) — không liên quan Tech, bỏ qua.

#### Tổng hợp billing T03/2026 (all sources)

| Source | Account | Số tiền | Thẻ | Loại phiếu |
|---|---|---|---|---|
| Azure consumption | Công ty cổ phần Wecare Group | $1,160.87 | MC ****6249 (cty) | Bảng kê chi phí |
| Google Workspace | Google | $471.26 | Visa ****6073 (Khôi) | ĐNTT hoàn tiền |
| M365 licenses | wecare.com.vn | ~$121.00 | Thẻ Khôi | ĐNTT hoàn tiền |

#### Azure Billing Profile

| Thông tin | Giá trị |
|---|---|
| Billing profile | Công ty cổ phần Wecare Group |
| Invoice section | LÊ THỊ NGỌC ANH |
| Month-to-date (T03) | $648.13 |
| Last month (T02) | $1,055.49 |

#### Lịch sử billing Azure (từ portal)

| Tháng | Thẻ thanh toán | Invoice ID | Số tiền | Loại phiếu cần lập |
|---|---|---|---|---|
| T01/2026 | 🟡 Visa ****6073 (Khôi) | G133744309 | $362.11 | ĐNTT hoàn tiền |
| T02/2026 | 🔴 MC ****6249 (cty) | G139815737 | $479.69 | Bảng kê chi phí |
| T03/2026 | 🔴 MC ****6249 (cty) | G145113496 | $1,160.87 | Bảng kê chi phí |

**2 phương thức thanh toán services (Azure, Google...):**

| Thẻ | Chủ thẻ | Loại | Ghi chú |
|---|---|---|---|
| **Visa ****6073** | Khôi Trần (CEO) | Thẻ cá nhân | Trước đây dùng chính, nay backup |
| **MasterCard ****6249** | Công ty | Tín dụng, hạn mức 50tr VNĐ | Dùng chung với Sale/Marketing |

**Quy tắc xử lý:**

| Trường hợp | Hành động | Loại phiếu |
|---|---|---|
| Trừ **thẻ công ty** (MasterCard ****6249) | Lập bảng kê khai chi phí → gởi KT | Bảng kê chi phí |
| Trừ **thẻ Khôi** (Visa ****6073) | Lập ĐNTT hoàn tiền cho Khôi | Đề Nghị Thanh Toán |
| Thẻ cty hết hạn mức (Sale/Marketing dùng hết) | Báo KT nạp tiền trước billing cycle | ⚠️ Alert KT |

#### Tech Stack
- Python 3 + `openpyxl` — ghi data vào Excel
- CSV — format trung gian để đọc/fill data nhanh

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

#### Dependencies
- `openpyxl` — cài bằng `pip install openpyxl`

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
- [ ] Build MCP / Skill lấy billing data tự động từ Azure + Google (sau khi fix quyền API)
- [ ] Theo dõi hạn mức thẻ cty hàng tháng

