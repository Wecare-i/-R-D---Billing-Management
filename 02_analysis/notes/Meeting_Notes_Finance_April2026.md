# Tổng hợp Thông tin & Vấn đề Thanh toán Chi phí Tech (Meeting Kẻ toán trưởng - Tháng 4/2026)

Tài liệu này tổng hợp toàn bộ hiện trạng, quy định mới từ Tài chính, và các "tiết lộ" rủi ro hệ thống thực tế đang diễn ra trong luồng thanh toán dịch vụ Cloud của bộ phận Tech.

## 1. Thông tin quy định hiện hành (Context)
- **Nguyên tắc "Tiền kiểm thay vì Hậu kiểm":** 100% các chi phí phát sinh dịch vụ/mua hàng đều phải được làm Đề xuất duyệt trước qua System. Bất kỳ khoản thanh toán nào chưa duyệt rủi ro cao sẽ bị **Từ chối thanh toán**.
- **Deadline ngày 25:** Team Tài chính yêu cầu chốt số vào ngày 25 hàng tháng để làm Đề xuất thanh toán trình BOD, khoản này là căn cứ neo giá trị cho ĐNTT chính thức sau này.
- **Siết thanh toán dòng tiền:** Công ty rà soát dòng tiền cân đối theo tuần. Trễ deadline sẽ rớt sang tháng sau.
- **Nhân sự phụ trách:** Chị **Dương Huỳnh Anh** phụ trách kiểm tra, duyệt hồ sơ hạch toán chi phí văn phòng HCM từ ngày 25/03/2026.

## 2. Các vấn đề cốt lõi & Rủi ro hoạt động (Pain Points)

### 2.1 Cú "Catch-22" (Tình thế bế tắc) giữa đặc thù Cloud (PAYG) và Quy tắc chốt ngày 25
- Dịch vụ lõi (Azure, Google Cloud) vận hành theo cơ chế **Pay-As-You-Go** (dùng tới đâu tính tiền tới đó).
- Hóa đơn chính thức (Invoice) với số tiền cố định chỉ được hệ thống hãng chốt và xuất vào **mùng 1 hoặc mùng 2 tháng tiếp theo**.
- **Nghịch lý & Vòng lặp chết (The Deadlock):**
  - Nếu Tech đợi có số chính xác vào mùng 1 -> Trễ deadline Đề xuất (ngày 25).
  - Vì không trình Đề xuất trước ngày 25 -> Kế toán **từ chối chi tiền (ĐNTT)**.
  - Kế toán không chi tiền -> Thanh toán hãng bị fail.
  - Thanh toán fail -> Cloud **cắt toàn bộ service (Service Stop)**.
  - Service Stop -> Toàn bộ công ty tê liệt ứng dụng, **gây hoảng loạn và thiệt hại kinh doanh cực kỳ lớn (la làng)**.
- Việc ép buộc ngày 25 phải có "số tiền chốt" hiện tại đang đẩy Tech vào thế: tuân thủ quy trình Tài chính thì rủi ro rất cao sẽ đánh sập hệ thống IT của Cty.

### 2.2 Điểm mù Thẻ Tín Dụng & Rủi ro gián đoạn Dịch vụ (Suspend Service)
- Phương thức thanh toán hiện tại: Gắn trực tiếp **Thẻ tín dụng Công ty (Hạn mức 50.000.000 VNĐ)**.
- **Xung đột tài nguyên bảo lãnh:** Thẻ này đang dùng **chung** với team Sales và Marketing (những bộ phận có dao động tiêu tiền ads cực lớn).
- **Trường hợp tắc nghẽn thực tế (Ví dụ nhãn tiền):** Hôm nay BOD chỉ đạo mua khẩn cấp 6 tài khoản Claude Pro (~$165) bắt buộc dùng thẻ công ty. Nhưng hiện tại thẻ cty **đã bị quẹt hết hạn mức**, khiến chỉ đạo của BOD bị đứng cứng ngắc không thể thực thi. Xa hơn, nếu mua được thì tới tháng sau cũng không ai dám đảm bảo thẻ còn dung lượng để gia hạn tự động.
- **Rủi ro sập hệ thống (Auto-Payment Failures):** Đến kỳ thanh toán tự động của Microsoft/Google, nếu thẻ hết hạn mức, hệ thống thanh toán tự động fail. Sau 15 ngày ân hạn (grace period), toàn bộ hạ tầng IT của công ty sẽ bị **buộc tạm dừng (suspend)** vô điều kiện. 
- Mặc dù Tài chính có kế hoạch nâng hạn mức thẻ lên **500.000.000 VNĐ**, nhưng hiện tại quy trình **vẫn đang treo và chưa có ETA (thời gian hoàn thành) cụ thể**. Rủi ro sập service vẫn hiển diện hàng ngày.

### 2.3 Mù thông tin số dư (Lack of Visibility)
- Tech Lead là người quản lý nguồn sống của các Cloud Service bị gắn vào chiếc thẻ trên, nhưng lại **không được cấp quyền chủ động kiểm tra số dư khả dụng** của thẻ.
- Mỗi lần hồi hộp tới chu kỳ trừ tiền, Tech lại phải lệ thuộc vào việc "nhờ Kế toán check giùm xem thẻ còn đủ tiền quẹt không" — gây phiền hà, mất thời gian, và tạo ra thế hoàn toàn bị động trong quản trị rủi ro hệ thống công nghệ.

### 2.4 Cú vênh Tỷ giá: Thanh toán tiền USD nhưng Thẻ lại trừ tiền VND
- **Bản chất giao dịch:** Hóa đơn gốc của hãng (Azure, M365, Google Workspace) xuất và yêu cầu thanh toán bằng **USD**, nhưng thẻ tín dụng của công ty khi quẹt lại **bị ngân hàng trừ bằng tiền VND**.
- **Sự sai lệch lúc làm Đề xuất:** Khi Tech làm Đề xuất tổng (chốt số ngày 25 hoặc mùng 1), hệ thống chỉ cho phép nhập số VND tạm tính theo tỷ giá tham khảo. 
- **Lúc trừ tiền thực tế:** Ngân hàng sẽ áp dụng **tỷ giá bán ngoại tệ của ngày quẹt thẻ + Phí chuyển đổi ngoại tệ**, dẫn đến số tiền VND bị trừ thực tế luôn bị "vênh" so với lúc dự báo.
- **Hậu quả quy trình:** Kế toán thường yêu cầu "số tiền VND trên ĐNTT phải khớp y chang số đã trình duyệt trên Đề xuất". Điều này là **bất khả thi về mặt kỹ thuật** với các giao dịch quốc tế, gây kẹt hồ sơ thanh toán kéo dài.
