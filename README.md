# Quy Trình Fill Bảng Kê Chi Phí

## Tổng quan
Quy trình fill data vào phiếu **Bảng kê chi phí** hàng tháng cho bộ phận Tech — dùng `openpyxl` ghi trực tiếp vào file Excel template.

## Input cần cung cấp
1. **Tháng/Năm** cần xuất (ví dụ: T02/2026)
2. **Danh sách chi phí** từ các nguồn:
   - Azure Portal / M365 Admin Center → invoice ID, số tiền USD
   - Google Cloud Console → payment number, số tiền USD
   - M365 licenses (wecare.com.vn MOSA) → invoice IDs, số tiền USD
3. **Tỷ giá USD/VND** (nếu cần quy đổi, hoặc để KT tự quy)

## Quy trình xuất

### Tính dự báo cuối tháng (End-of-Month Forecast)
Đối với các chi phí đang chạy trong tháng hiện tại (Year-to-Date / Month-to-Date), áp dụng công thức sau để dự báo:
- **Công thức:** `(Số tiền Ghi nhận hiện tại / Số ngày đã chạy) * 30`
- **Ví dụ GCP tháng 4:** Nếu hôm nay là ngày 20, dữ liệu GCP tracking chốt đến ngày 19 (19 ngày) với số tiền là `2,202,967 VNĐ`. → Forecast = `(2,202,967 / 19) * 30 = 3,478,368.95 VNĐ`.
*(Logic này sẽ được apply vào Dashboard và các script tính toán sau này).*

```
1. Khoanh vùng chi phí (MTD Forecast nếu chưa có số chốt)
2. Copy template gốc → 03_outputs/Tech_Bảng kê chi phí_T{MM}.{YYYY}.xlsx
3. Dùng openpyxl ghi data vào 2 sheets:
   - Sheet 1: Phiếu đề nghị hoàn ứng (tổng hợp)
   - Sheet "Hồng Trinh (Không HĐ)": Bảng kê chi phí chi tiết (liệt kê từng khoản)
4. Anh review file → xác nhận tỷ giá + format
5. Gởi KT ✅
```

## Policy: Yêu cầu từ Team Tài chính (18/04/2026)
🔴 **THÔNG BÁO QUAN TRỌNG: TUÂN THỦ QUY TRÌNH PHÊ DUYỆT CHI PHÍ** 🔴

Đối với tất cả các phát sinh dịch vụ/mua hàng (bao gồm **chi phí cloud/licenses hàng tháng thanh toán bằng thẻ Visa cá nhân**), BẮT BUỘC tuân thủ nguyên tắc **Tiền kiểm thay vì Hậu kiểm** thông qua Quy trình 2 bước:

**BƯỚC 1: ĐỀ XUẤT TỔNG ĐẦU THÁNG (Approval Request)**
- Thời gian: **Từ ngày 01 đến ngày 05** đầu mỗi tháng.
- Hành động: Gửi **01 bản đề xuất tổng duy nhất** (tổng hợp kế hoạch chi tiêu/forecast của tất cả chi phí cố định trong tháng) lên System để duyệt. (Sẽ mất 2-3 ngày approve).
- Phát sinh đột xuất: Chỉ chi phí bất khả kháng / rớt ngoài kế hoạch mới được làm đề xuất riêng lẻ giữa tháng.

**BƯỚC 2: ĐỀ NGHỊ THANH TOÁN (Payment Request)**
- Thời gian: Trong tháng, ngay sau khi có invoice/thực tế phát sinh.
- Hành động: Link vào *Đề xuất tổng* (đã duyệt ở Bước 1) để làm từng Đề nghị thanh toán. Gửi kèm hóa đơn (Invoice) chính thức để Kế toán hoàn thiện hồ sơ và nộp thuế nhà thầu.
- *Lưu ý: Dòng tiền được cân đối theo tuần nên cần chủ động lập hồ sơ sớm.*

> ⚠️ **Rủi ro nghiêm trọng nếu làm sai:**
> - Các khoản chi ngoài kế hoạch (chưa phê duyệt qua Bước 1) sẽ làm vỡ luồng cân đối dòng tiền của Cty.
> - Bất kỳ ĐNTT nào lập *sau khi* đã mua/sử dụng dịch vụ mà chưa được duyệt sơ bộ đều bị **TỪ CHỐI THANH TOÁN**.
> - Mọi xác nhận bằng miệng, tin nhắn, email đều **KHÔNG có giá trị pháp lý**. Chỉ duyệt qua System!

## Cấu trúc Excel Template

### Sheet 1 — Phiếu đề nghị hoàn ứng (index 0)

| Ô | Nội dung | Ví dụ |
|---|---|---|
| `H2` | Ngày tạo phiếu | `Ngày/Day 09 Tháng/Month 02 Năm/Year 2026` |
| `S2` | Số phiếu | `KTWC/Tech/T02` |
| `B4` | Họ tên | `Hiếu Lê` |
| `J4` | Chi nhánh | `HCM` |
| `N4` | Bộ phận | `Tech (R&D/Core)` |
| `V4` | Chức danh | `Tech Lead` |
| `A6` | STT | `1` |
| `B6` | Loại chi phí | `Chi phí dịch vụ CNTT` |
| `E6` | Nội dung (mô tả chi tiết) | `Chi phí dịch vụ CNTT tháng...` |
| `Q6` | Số tiền (number, format `#,##0.00`) | `756.02` |
| `V6` | Ghi chú/Số hóa đơn | `G139815737 / A42739892...` |
| `Q7` | Tổng cộng (formula `=Q6`) | — format `#,##0.00` |
| `C8` | Bằng chữ | `Bảy trăm năm mươi sáu đô la và hai xu Mỹ` |
| `L9` | Ngày tạm ứng | datetime object |
| `R9` | Số tiền tạm ứng | `0` |
| `R10` | Số tiền còn phải thanh toán | `0` (đã trừ thẻ cty) |
| `A19` | Người đề nghị | `Hiếu Lê` |
| `K19` | Kế toán | `Dương Huỳnh Anh` *(Thay Võ Quốc Thắng từ 25/03)* |
| `R19` | BOD phê duyệt | `Lê Thị Ngọc Anh` |

> ⚠️ **LƯU Ý DEADLINE THÁNG**: Công ty đang siết thanh toán. Đề xuất kế hoạch chi tiêu tháng mới (Bước 1) thường có deadline vào khoảng **mùng 3-5 hàng tháng**. Các khoản ngoài kế hoạch nộp trễ sẽ bị loại trừ hoặc đẩy lùi sang tháng sau!

### Sheet "Hồng Trinh (Không HĐ)" — Bảng kê chi tiết (index 7)

Rename thành `Tech_BKCP_T{MM}` khi fill.

**Header (rows 3-5):**

| Ô | Nội dung |
|---|---|
| `H2` | Số phiếu: `KTWC/Tech/BKCP-T02` |
| `C3` | Họ tên: `Hiếu Lê` |
| `H3` | Loại chi phí: `Chi phí dịch vụ CNTT` |
| `C4` | Chức danh: `Tech Lead` |
| `H4` | Ngày đề xuất: datetime |
| `B5` | Bộ phận: `Tech (R&D/Core)` |
| `D5` | Chi nhánh: `HCM` |
| `H5` | Mục đích chi: `Chi phí dịch vụ CNTT` |

**Rows 6-11**: Clear hết (template có data người khác).

**Data rows (bắt đầu từ row 14):**

| Cột | Nội dung | Ví dụ |
|---|---|---|
| `A` | STT | `1` |
| `B` | Ngày hóa đơn | datetime |
| `C` | Ghi chú/Số hóa đơn | `G139815737` |
| `D` | Nội dung | `Azure Cloud Services - Chi phí cloud tháng 01/2026` |
| `F` | Ngoại tệ | `USD` |
| `G` | Số tiền | `479.69` |
| `I` | Tổng số tiền (VND) | formula `=G14` hoặc `=G14*H14` (nếu có tỷ giá) |

**Total row 24:** `G24 = =SUM(G14:G{last})`, `I24 = =SUM(I14:I{last})`

**Signer row 32:** `G32` = Người đề nghị (`Hiếu Lê`)

## ⚠️ Lưu ý quan trọng (Lessons Learned)

### Merged Cells
- Template có **nhiều merged cells** → KHÔNG thể ghi vào ô con (MergedCell).
- Row 7 sheet 1 là `A7:P7` merged (Tổng cộng) → chỉ ghi được vào `Q7`.
- Rows 6-11 sheet 2 có merged cells → clear bằng cách check `isinstance(cell, MergedCell)`.

### Number Format
- Số tiền PHẢI set `number_format = '#,##0.00'` cho Q6, Q7 → nếu không Excel sẽ cắt thành số nguyên.

### Tiếng Việt (Diacritics)
- **BẮT BUỘC** dùng tiếng Việt có dấu trong mọi ô text.
- Set `PYTHONIOENCODING=utf-8` và `-X utf8` khi chạy Python.
- Dùng `glob.glob()` để tìm file thay vì hardcode path có ký tự Unicode.

### File Lock
- **PHẢI đóng file Excel** trước khi chạy script → nếu không sẽ bị `PermissionError`.
- Nhắc user đóng file trước mỗi lần chạy.

### Template có nhiều sheets
- Template gốc có **27 sheets** (Marketing, Sales, etc.) → chỉ sửa 2 sheets cần dùng.
- Sheet 1 (index 0): Phiếu đề nghị hoàn ứng.
- Sheet "Hồng Trinh (Không HĐ)" (index 7): Bảng kê chi tiết → dùng làm template BKCP.

## Naming Convention

**File output:**
```
Tech_Bảng kê chi phí_T{tháng}.{năm}.xlsx
```

**File invoice** (trong `01_inputs/invoices/T{MM}.{YYYY}/`):
```
{Service}_{InvoiceID}.pdf|htm
```
Ví dụ: `Azure_G145113496.pdf`, `Google_A76357681460981268.htm`

## Cấu trúc thư mục
```
Billing Management/
├── 01_inputs/
│   ├── invoices/           # Hóa đơn gốc (_upload tạm, T02.2026...)
│   └── templates/          # Template gốc — KHÔNG SỬA
├── 02_analysis/
│   └── notes/              # Ghi chú, tài liệu tham khảo, meeting notes
├── 03_outputs/             # File đã fill → gởi KT, báo cáo tổng hợp
├── dashboard/              # UI Code (React/NextJS) liên quan reporting
├── scripts/
│   └── fill_expense.py
├── PROJECT.md
└── README.md
```
