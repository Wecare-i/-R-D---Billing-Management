# Q&A Checklist: Đàm phán Thanh toán Chi phí Cloud với Kế toán trưởng
*Chuẩn bị cho cuộc họp Thứ 5*

Dưới đây là danh sách các câu hỏi trọng tâm (đã được cấu trúc theo dạng nêu Vấn đề -> Đặt Câu hỏi) để anh dùng làm "vũ khí" đàm phán trực tiếp với Kế toán trưởng. Mục tiêu của checklist này là đi thẳng vào giải pháp, buộc Finance phải đưa ra cơ chế phù hợp thay vì áp quy định cứng nhắc.

---

### Chủ đề 1: Đề xuất "Forecast Buffer" để gỡ bài toán Chốt sổ ngày 25
- **Vấn đề đặt ra:** Tài chính yêu cầu chốt số vào ngày 25. Nhưng Cloud (Pay-As-You-Go) phải đến mùng 1-2 hãng mới xuất hóa đơn chính thức. Ép số cứng ngày 25 là đi ngược cách vận hành của Cloud thế giới.
- **Câu hỏi cho Kế toán (Q):**
  1. Thay vì bắt Tech chốt số chính xác tuyệt đối vào ngày 25, Kế toán có đồng ý duyệt cơ chế **"Dự báo + Buffer (dung sai) 10-15%"** trên hệ thống không?
  2. Tức là ngày 25 Tech tạo Đề xuất tổng = *Chi tiêu hiện tại + Ước tính phần còn lại + 10% rủi ro tỷ giá*. Khi nào có hóa đơn (mùng 1), Tech làm ĐNTT giá trị thực tế (miễn là nhỏ hơn con số Buffer đã duyệt). Phương án này có hợp lệ không?
  3. Nếu Kế toán vẫn đòi "khớp 100% nguyên xi số ngày 25", ngân quyền sẽ xử lý sao với những traffic spike (đột biến truy cập) xảy ra vào rạng sáng ngày 30 gây đội chi phí?

### Chủ đề 2: Cú vênh tỷ giá & Thẻ tín dụng VND thanh toán USD
- **Vấn đề đặt ra:** Hóa đơn Cloud neo bằng USD, nhưng Thẻ công ty lại trừ tiền VND vào ngày quẹt thẻ (tỷ giá thả nổi + phí giao dịch quốc tế).
- **Câu hỏi cho Kế toán (Q):**
  1. Số trên hóa đơn (Invoice của Microsoft/Google) là USD. Hệ thống chỉ cho quy đổi VND ở thời điểm làm Đề xuất. Đến ngày quẹt thẻ, ngân hàng lại trừ một số tiền VND khác. Việc Kế toán trả hồ sơ bắt phải làm lại giấy tờ cho khớp số VND cuối cùng là rất hành chính. Chị có hướng xử lý nào để chấp nhận độ vênh tỷ giá (Foreign Exchange Variance) như một khoản chi hợp lý không cần làm lại trình duyệt hay không?
  2. Tech có được phép đính kèm **Sao kê tin nhắn trừ tiền từ Ngân hàng / Thẻ tín dụng** làm chứng cứ để hạch toán phần chênh lệch tỷ giá này luôn mà không cần "hồi môn" lại tờ Đề xuất tuần trước không?

### Chủ đề 3: "Quả bom nổ chậm" Hạn mức Thẻ Tín Dụng 50tr
- **Vấn đề đặt ra:** Thẻ cty (50M) đang dùng chung với team Marketing/Sales. Vừa qua vụ mua Claude Pro ($165) bất thành do thẻ "cháy" trần. Quan trọng hơn, nếu thẻ hết rỗng vào lúc Microsoft tự động trừ tiền duy trì Server, hệ thống sẽ sập sau 15 ngày.
- **Câu hỏi cho Kế toán (Q):**
  1. Cụ thể kế hoạch nâng hạn mức thẻ lên 500tr hiện đang nằm ở bước nào, dự kiến ngày nào hoàn thành (ETA)?
  2. Tech Lead chịu trách nhiệm sinh tử cho hệ thống nhưng hoàn toàn "mù" số dư của cái thẻ đang nuôi Server. Trong thời gian chờ thẻ 500tr, Tài chính có thể **chủ động cảnh báo cho Tech** khi thẻ cán mốc 40tr không?
  3. Liệu Kế toán có giải pháp **tách riêng 1 thẻ (hoặc Thẻ ảo - Virtual Card)** chỉ chuyên chạy thanh toán Cloud cho Tech, cách ly hoàn toàn dòng tiền Ads của Marketing để tránh rủi ro sập Server bị động không?

### Chủ đề 4: Cơ chế "Cấp Cứu" (Emergency Escalation) cho Cost Spike
- **Vấn đề đặt ra:** Policy có nêu rõ: "Mọi ĐNTT sau khi mua dịch vụ mà chưa được duyệt sơ bộ đều bị TỪ CHỐI THANH TOÁN".
- **Câu hỏi cho Kế toán (Q):**
  1. Nếu rạng sáng T7, CN hệ thống bị tấn công DDoS khiến băng thông (Bandwidth/CDN) vọt lên vài chục đô, hoặc xảy ra sự cố cần spin gấp 1 server phụ để cứu nét (vượt xa 10-15% Buffer). Khi Tech giải trình khẩn vào sáng T2, Kế toán có cơ chế Ngoại lệ (Exception Flow) cho việc này không? Hay vẫn cúp mỏ neo "Chưa trình duyệt trước -> Từ chối nạp tiền"?

---
> [!TIP]
> **Chiến lược chốt hạ:** Sau khi đưa ra 4 nhóm câu hỏi trên, anh có thể chốt lại với Kế toán nguyên tắc tối thượng: *"Yêu cầu của Tech không phải là muốn luồn lách quy trình duyệt, mà là xin một cơ chế đặc thù cho các dịch vụ cốt lõi của công ty (IT Core Services) để đảm bảo không bị đứng hệ thống, tiền trảm (duyệt forecast) - hậu tấu (quyết toán bằng invoice thật)."*
