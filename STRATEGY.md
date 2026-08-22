# Founder Deck — đánh giá PRD & chiến lược

Viết cho: Hien · 22/08/2026 · dựa trên dữ liệu thị trường ngày 20–22/08/2026

---

## 0. Ba con số quyết định mọi thứ khác

| | |
|---|---|
| outbid.lol launch | **20/08/2026** — cách đây 2 ngày, build trong 3 giờ |
| Tổng bid trên board của họ | **~$91,390 / 538 bids** |
| Clone xuất hiện | trong **24 giờ đầu**; đã có `outbid-directory.lol` chuyên liệt kê clone |

PRD của anh là spec cho một sản phẩm 4–6 tuần. Wave này được tính bằng **ngày**. Đó là mâu thuẫn lớn nhất trong tài liệu, và mọi khuyến nghị dưới đây đều xuất phát từ nó.

Bài viết về outbid ghi rõ: các clone launch trong 24h đầu chết **vì thiếu distribution, không phải vì sản phẩm dở**. Anh trả lời là gần như không có kênh đẩy. Nên đọc phần 2 trước khi đọc phần nào khác.

---

## 1. Đánh giá PRD

### Những chỗ PRD đúng — em giữ nguyên hết

**Tách phí claim khỏi bid.** Đây là ý hay nhất trong toàn bộ tài liệu, và nó là lý do duy nhất khiến dự án này không phải clone. Outbid có một nỗi đau thật: trả tiền, bị vượt, mất trắng. "Card ở lại vĩnh viễn, chỉ có rank là chạy" giải quyết đúng nỗi đau đó bằng một câu. Em đã đưa câu này lên landing, lên trang card, lên footer, lên cả ảnh share.

**Rank = tổng bid, hoà thì ai đạt mốc trước xếp trên.** Đơn giản đến mức không ai cãi được, và không cần một dòng "thuật toán công bằng" nào. Em viết nguyên văn quy tắc lên `/rules` — đó là toàn bộ thuật toán, không có trang thứ hai.

**Chỉ chủ card được boost.** Đúng. Lý do PRD đưa ra (attribution, refund, chống rửa tiền, tránh kỳ vọng sai từ người ủng hộ) đều chuẩn.

**Gói boost cố định, client không tự nhập số tiền.** Đúng cả về UX lẫn bảo mật. Trong code, `lib/packs.ts` là nguồn sự thật duy nhất về tiền; client chỉ gửi `packId`.

**Danh sách anti-pattern ở mục 10.** Phần giá trị nhất mà anh có thể không nhận ra: đó chính là thứ giữ cho tài khoản Polar của anh không bị khoá. Cổng thanh toán rất nhạy với ngôn ngữ cờ bạc và với sản phẩm hứa hẹn traffic. Em đã viết `/rules` bám đúng danh sách này.

**Multi-view discovery.** Đúng về nguyên tắc — nếu top 10 hút hết attention thì người trả $2 thấy vô nghĩa và không quay lại.

### Những chỗ PRD sai — em đã sửa

**① Phí claim $9–$29 sẽ giết dự án. Đây là lỗi chí mạng.**

PRD ngầm giả định demand đã tồn tại. Outbid có 4,500 khách trong vài giờ đầu nên thu $9 ngay lập tức là hợp lý. Anh không có 4,500 khách. Anh có 0.

Một board trống + paywall $9 = **0 conversion**, không phải "ít conversion". Không ai là người đầu tiên trả tiền để đứng một mình trên một cái bảng trống.

→ **Claim = miễn phí.** Tiền đến hoàn toàn từ boost.

Free claim tạo supply → supply làm board đáng nhìn → board đáng nhìn tạo cạnh tranh → cạnh tranh tạo doanh thu. Bỏ mắt xích đầu là mất cả chuỗi.

Con số đối chiếu với mục 9.2 của PRD:

| | PRD (claim $16 TB) | Mô hình của em (claim free) |
|---|---:|---:|
| Người vào form | giả định 300 | giả định 300 |
| Thực tế hoàn tất khi có paywall trên board trống | ~0–5 | — |
| Card thật tạo ra | ~0–5 | ~300 |
| Tỉ lệ boost | không đo được | 15% × $12 TB |
| **Doanh thu** | **~$0–80** | **~$540** |

$540 không phải tiền lớn. Nhưng $540 > $0, và $0 là kết quả thật của việc dựng paywall trên board rỗng.

**② Scope gấp ~5 lần thời gian sống của wave.**

Em cắt xuống còn 6 trang, giữ đúng vòng lặp trò chơi. Bỏ: Economy Lab, upload logo, xác thực domain thủ công, trang category riêng, seasons UI, admin panel.

**③ "80 seeded cards" — chỗ này nguy hiểm, PRD không cảnh báo đủ.**

PRD gọi đó là prototype data. Nhưng nếu anh launch board thật với 97 sản phẩm không ai xin phép, đó là **fake activity** — đúng thứ mục 10 của PRD cấm, và là thứ khiến người ta screenshot rồi bóc phốt.

Em đã seed 97 card để anh **nhìn thấy hệ thống chạy**. Có sẵn `npm run db:clear` để xoá sạch. **Chạy nó trước khi nhận đồng đầu tiên.**

**④ Economy Lab không cần thiết lúc này.**

Nó là công cụ để trả lời những câu hỏi mà thị trường sẽ trả lời miễn phí trong 48 giờ, với dữ liệu thật thay vì giả định. Nếu sau 2 tuần dự án sống, lúc đó Lab mới có dữ liệu để mô phỏng.

**⑤ Lỗ hổng lớn nhất: PRD có 15 mục và không mục nào nói về distribution.**

Đây là thứ duy nhất quyết định anh có tiền hay không, và nó không xuất hiện ở đâu cả. Phần 2 và 5 dưới đây là phần em viết thêm.

---

## 2. Sự thật khó nghe

Em nói thẳng vì anh cần con số thật để quyết định, không cần động viên.

- outbid.lol làm được $91K vì nó là **cái đầu tiên**, và founder có sẵn kênh trên X. Clone thứ 100 không có cả hai điều đó.
- Xác suất anh kiếm được $10K từ dự án này: **rất thấp**. Xác suất kiếm $200–$1,000 nếu làm đúng và nhanh: **hợp lý**.
- Vì vậy: **đừng bỏ tiền quảng cáo vào đây.** Chi phí cận biên nên giữ đúng $0 — Neon free tier, Vercel free tier, Polar chỉ thu phí khi có giao dịch. Nếu dự án chết, anh mất thời gian chứ không mất tiền.
- Thứ có giá trị hơn tiền ở lần này: anh có một codebase payment-ready đã test kỹ (webhook idempotency, transaction chống race, checkout server-side). Dùng lại được cho dự án sau, và dự án sau có thể không phải chạy đua với wave.

**Điểm khác biệt thật sự** của Founder Deck so với clone: card không mất đi. Nếu anh chỉ nói được một câu khi launch, nói câu đó — không nói "như outbid nhưng...".

---

## 3. Mô hình kinh tế khuyến nghị

| Quyết định | Khuyến nghị | Vì sao |
|---|---|---|
| Phí claim | **$0** | Cold start. Xem mục ①. |
| Gói boost | $2 / $5 / $10 / $25 / $50 | $2 là mức "thử cho vui" — cửa vào rẻ nhất. $50 đủ để tạo cú nhảy đáng post lên X. |
| Ai được boost | Chỉ chủ card (v1) | Theo PRD. Đúng. |
| Sức chứa Season 01 | **1,000** (không phải 5,000) | 5,000 làm board trông trống vĩnh viễn. 1,000 cho phép nói "còn 903 số" — khan hiếm thật, kiểm chứng được. |
| Bid giảm theo thời gian | Không | Khó giải thích, dễ bị coi là tận thu. |
| Hoàn tiền | Không hoàn bid đã ghi nhận | Đã ghi rõ ở `/rules` và trong modal boost. |
| Tie-break | Ai đạt mốc trước | Thưởng người hành động sớm, minh bạch tuyệt đối. |
| Founding | #0001–#0100 | Giữ nguyên theo PRD. |

**Doanh thu nếu mọi thứ diễn ra tốt** (không phải dự báo, là mô hình):

```
300 card thật  ×  15% boost  ×  $12 trung bình   ≈  $540
Polar giữ ~4% + $0.40/giao dịch                  ≈  -$40
                                                    ------
                                                    ~$500
```

Nếu 5% trong số đó boost tiếp lần hai lên mức $25–$50 để giành top: cộng thêm ~$300–600.

---

## 4. Vòng lặp viral duy nhất anh có

Không có audience thì kênh duy nhất là **chính người dùng đi khoe**. Nên toàn bộ chi phí "marketing" của anh nằm ở một chỗ: ảnh share.

Em đã build `/og/[slug]` — ảnh 1200×630 sinh động, in rõ số claim, tên sản phẩm, rank, tổng bid, tier. Nó tự gắn vào thẻ Twitter/OG của mọi trang card.

Ba khoảnh khắc đã có nút share, và đó là ba khoảnh khắc duy nhất người ta muốn khoe:

1. **Vừa claim xong** — "tôi là #0042" (con số thấp là thứ đáng khoe nhất khi board còn mới)
2. **Vừa lên rank** — "#17 → #12, vượt 5 card"
3. **Xem card của mình bất kỳ lúc nào**

Nếu anh chỉ được tối ưu một thứ trong sản phẩm này, tối ưu cái ảnh đó.

---

## 5. Kế hoạch 72 giờ

**Giờ 0–2 · Đưa lên mạng**
- `npm run db:clear` — xoá 97 card demo
- Tạo 5 product trong Polar ($2/$5/$10/$25/$50), lấy product ID + webhook secret
- Deploy (xem README), điền env, đặt `SIMULATE_PAYMENTS=0`
- Mua domain. Tên nên tránh chữ "bid" — cả trăm clone đang dùng.

**Giờ 2–12 · Lấp board bằng card THẬT**
- Đây là phần khó và không thể tự động hoá. DM 50 indie founder trên X, mỗi người một tin nhắn viết tay.
- Chào bằng thứ thật sự có giá trị: một con số Founding vĩnh viễn, miễn phí. Không nói "hãy trả tiền".
- Mẫu tin nhắn:
  > *"Mình đang làm Founder Deck — mỗi sản phẩm được một card vĩnh viễn với số thứ tự riêng. Card ở lại kể cả khi bị vượt hạng, khác với mấy board pay-to-rank đang chạy. Mình giữ #00xx cho [tên sản phẩm] nếu bạn muốn. Miễn phí, 30 giây, không cần tài khoản: [link]"*
- Mục tiêu: **20 card thật** trước khi post công khai.

**Giờ 12–24 · Post công khai**
- **Không bao giờ post một board trống.** Đây là lỗi giết nhiều clone nhất.
- Góc kể chuyện: không phải "tôi làm cái giống outbid". Mà là *"Board pay-to-rank có một vấn đề: trả tiền xong bị vượt là mất trắng. Mình làm bản mà card không bao giờ mất."*
- Kèm ảnh OG của một card đẹp, không phải screenshot cả trang.

**Giờ 24–48 · Bật boost**
- Nhắn riêng từng chủ card: rank hiện tại + khoảng cách tới card trên. Sản phẩm đã tính sẵn con số này trong panel chủ card.
- Đây là lúc tiền vào, không phải lúc claim.

**Giờ 48–72 · Quyết định**

Tiêu chí dừng — viết sẵn ra đây để anh không cắm đầu thêm 3 tuần:

| Sau 72 giờ | Hành động |
|---|---|
| < 20 card thật | Dừng. Wave đã qua. Giữ codebase. |
| 20–50 card, < 5 boost | Sản phẩm ổn, giá sai hoặc kênh sai. Thử một ngách hẹp (chỉ AI tools, hoặc chỉ sản phẩm VN) trước khi bỏ. |
| > 5 boost | Có tín hiệu. Lúc này mới đáng làm P1. |

---

## 6. Rủi ro

| Rủi ro | Mức | Xử lý |
|---|---|---|
| **Polar coi đây là sản phẩm quảng cáo / pay-for-placement** | Cao | Đọc AUP của Polar **trước khi** tạo product. Nếu có nghi ngờ, hỏi support trước. Bị khoá tài khoản giữa lúc đang chạy là kịch bản tệ nhất. |
| Card spam / link bẩn | Trung bình | Đã có: 1 card/domain, giới hạn 3 claim/IP/giờ, `/api/admin/hide`. Anh vẫn phải nhìn board mỗi ngày. |
| Chargeback | Thấp–TB | `/rules` ghi rõ không hoàn tiền, nhưng chargeback vẫn xảy ra. Với mức $2–50 thì thiệt hại nhỏ. |
| Wave chết trước khi anh xong | **Cao nhất** | Chỉ giảm được bằng tốc độ. Đó là lý do em cắt scope. |
| Mất link `?k=` là mất quyền boost | Cao | Chưa có email khôi phục — xem P0 dưới đây. |

---

## 7. Backlog

### P0 — bắt buộc xong trước khi nhận đồng đầu tiên
- [ ] Tạo product Polar + webhook secret, đặt `SIMULATE_PAYMENTS=0`
- [ ] `npm run db:clear` xoá dữ liệu demo
- [ ] **Email khôi phục owner token** — hiện tại mất link `?k=` là mất quyền boost card. Đây là lỗ hổng trải nghiệm nghiêm trọng nhất còn lại. Form claim đã thu email, chỉ cần gửi đi (Resend ~30 phút).
- [ ] Trang Terms + refund policy (nội dung đã có sẵn trong `/rules`, cần tách riêng cho Polar)
- [ ] Test một giao dịch thật $2 từ đầu đến cuối trên môi trường sandbox

### P1 — sau khi có tín hiệu
- [ ] Magic-link auth thay cho token trong URL
- [ ] Email "bạn vừa bị vượt hạng" — đây là động cơ boost lần hai, và là tính năng kiếm tiền tốt nhất chưa có
- [ ] Upload logo (hiện dùng monogram tự sinh — sạch, nhưng logo thật đẹp hơn)
- [ ] Trang category riêng cho SEO

### P2 — nếu dự án sống quá 2 tuần
- [ ] Season 02 + lưu trữ Season 01
- [ ] Economy Lab như PRD mô tả
- [ ] Xác thực domain qua DNS record

---

## 8. Câu hỏi cần anh quyết trước khi launch

1. **Tên và domain.** "Founder Deck" là tên tạm em đặt. Tránh chữ "bid".
2. **Season 01 = 1,000 số?** Em khuyến nghị 1,000. Con số này in lên mọi card nên đổi sau rất khó.
3. **Thị trường nào?** Global (đông nhưng cả trăm clone đang tranh) hay cộng đồng VN (nhỏ hơn nhiều nhưng gần như không có ai làm, và anh nói chuyện được bằng tiếng mẹ đẻ)? Với zero distribution, em nghiêng về VN.
4. **Có mở "ai cũng boost được" không?** v1 để owner-only theo PRD. Mở ra thì doanh thu có thể tăng nhưng kéo theo rủi ro attribution và rửa tiền.
5. **Anh chấp nhận bỏ bao nhiêu giờ trước khi dừng?** Nên chốt con số này ngay bây giờ, trước khi có cảm xúc.

---

## 9. Những gì đã build và đã kiểm chứng

19/19 test tự động pass (`npm run test:rank`), gồm:

- Thứ tự rank khớp chính xác `total_bid DESC, bid_reached_at ASC`, không gãy ở bất kỳ vị trí nào trong 97 card
- Quy tắc hoà: card đạt mốc trước luôn xếp trên — bid sau để bằng không bao giờ vượt được
- 12 lượt boost $2 **đồng thời** trên cùng một card: cộng đủ $24, ghi đúng 12 dòng lịch sử, không mất một lượt nào (đây là lỗi mất tiền phổ biến nhất ở loại sản phẩm này)
- Toán "cần gói nào để vượt": khoảng cách $3 → gói $5; khoảng cách $120 → 3× gói $50
- Cả 5 view và tìm kiếm

Về bảo mật thanh toán: client không bao giờ quyết định số tiền, redirect từ Polar không thay đổi gì, chỉ webhook có chữ ký hợp lệ mới cộng bid, và mỗi event ID chỉ được xử lý một lần duy nhất (ràng buộc unique trong DB).
