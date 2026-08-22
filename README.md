# Founder Deck

A collectible product-card board with transparent public bids.
Claiming is free and permanent; boosting is optional, paid, and the only thing that moves rank.

> Đọc `STRATEGY.md` trước — nó giải thích vì sao mô hình kinh tế khác PRD gốc.

---

## Chạy local (5 phút)

```bash
npm install
cp .env.example .env.local     # điền DATABASE_URL
npm run db:push                # tạo bảng
npm run db:seed                # 97 card demo — XOÁ trước khi launch thật
npm run dev
```

Mặc định `SIMULATE_PAYMENTS=1`: boost chạy qua đúng mọi bước code như thật (tạo checkout → cộng bid trong transaction → tính lại rank → ghi lịch sử) nhưng không gọi Polar và không thu tiền. Bấm thử ngay được.

## Deploy lên Vercel

```bash
npx vercel --prod
```

Rồi vào **Settings → Environment Variables**, thêm:

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | connection string Neon (xem tin nhắn kèm) |
| `NEXT_PUBLIC_SITE_URL` | `https://<domain của anh>` — cần đúng, nếu không ảnh share sẽ hỏng |
| `SIMULATE_PAYMENTS` | `1` khi test, `0` khi nhận tiền thật |
| `ADMIN_TOKEN` | chuỗi ngẫu nhiên dài |

Database đã tạo và seed sẵn — chỉ cần dán `DATABASE_URL` là app chạy có dữ liệu ngay.
Nếu chưa điền, app hiện màn hình hướng dẫn thay vì lỗi 500.

## Bật thanh toán thật

1. Tạo 5 product trong Polar: $2 Spark, $5 Push, $10 Surge, $25 Breakout, $50 Takeover
2. Điền `POLAR_PRODUCT_SPARK`, `..._PUSH`, `..._SURGE`, `..._BREAKOUT`, `..._TAKEOVER`
3. Điền `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER=production`
4. Trỏ webhook Polar về `https://<domain>/api/webhooks/polar`, bật event `order.paid`
5. Đặt `SIMULATE_PAYMENTS=0`
6. Chạy thử một giao dịch $2 trên sandbox trước

---

## Cấu trúc

```
app/
  page.tsx              landing + ticker + top deck + just claimed
  cards/                deck grid: ranked / new / rising / founding / random + search
  c/[slug]/             card detail, bid history, challenger panel, owner panel
  claim/                form claim + preview card real-time
  rules/                toàn bộ luật, không có trang thứ hai
  og/[slug]/            ảnh share 1200×630 — kênh phân phối duy nhất
  api/boost             tạo checkout (server quyết định giá, không phải client)
  api/claim             cấp số claim tuần tự dưới advisory lock
  api/webhooks/polar    NƠI DUY NHẤT bid được phép tăng
  api/admin/hide        ẩn card xấu bằng ADMIN_TOKEN

lib/
  rank.ts               quy tắc xếp hạng + applyBoost transactional
  packs.ts              nguồn sự thật duy nhất về tiền
  rarity.ts             tier từ số liệu công khai, không random
  db/schema.ts          cards, boost_events, boost_checkouts, webhook_events
```

## Lệnh

```bash
npm run dev         # dev server
npm run build       # production build
npm run test:rank   # 19 test cho engine xếp hạng, tie-break, đua boost
npm run db:push     # apply migration
npm run db:seed     # 97 card demo
npm run db:clear    # XOÁ SẠCH — chạy trước khi launch thật
```

## Ba bất biến không được phá

1. **Rank luôn được tính, không bao giờ lưu.** `total_bid DESC, bid_reached_at ASC, id ASC` — một biểu thức duy nhất trong `lib/rank.ts`.
2. **Chỉ webhook đã xác thực chữ ký mới cộng bid được.** Redirect từ Polar không thay đổi gì. Mỗi event ID chỉ xử lý một lần (unique constraint trong DB).
3. **Card không bao giờ rời deck.** Ẩn được (moderation), nhưng không xoá — và lịch sử bid là append-only.
