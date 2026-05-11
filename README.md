# fb-page-bot

Bot quản lý fanpage Facebook: tự trả lời Messenger inbox, tự trả lời / ẩn comment, đăng bài theo lịch, thống kê — tích hợp Claude AI.

## Stack
- Node.js 20+ + Express
- Facebook Graph API v21
- Anthropic SDK (Claude Opus 4.7 mặc định)
- node-cron + lowdb (JSON file)

---

## 1. Cài đặt local

```powershell
cd C:\Users\nhuut\fb-page-bot
npm install
copy .env.example .env
```

Mở `.env` và điền các giá trị (xem mục 2 để lấy).

```powershell
npm start
```

Bot chạy ở `http://localhost:3000`.

---

## 2. Lấy credentials Facebook

### 2.1. Vào app GrowWise
https://developers.facebook.com/apps/940347085639623

### 2.2. App Secret
- **Settings → Basic** → copy **Khóa bí mật của ứng dụng (App Secret)** → điền `FB_APP_SECRET`
- ⚠️ **Reset App Secret nếu đã từng paste vào chat/screenshot.**

### 2.3. Thêm sản phẩm Messenger
- Sidebar → **Thêm sản phẩm** → chọn **Messenger** → Setup
- Phần **Access Tokens** → chọn fanpage của bạn → bấm **Generate Token**
- Copy token đó → điền `FB_PAGE_ACCESS_TOKEN`
- Page ID hiện ngay cạnh tên fanpage → điền `FB_PAGE_ID`

### 2.4. Convert sang long-lived token (60 ngày)
Token vừa tạo chỉ tồn tại 1-2 tiếng. Convert sang long-lived bằng URL sau (paste vào trình duyệt, thay 3 giá trị):

```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={FB_APP_ID}&client_secret={FB_APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}
```

Response trả ra `access_token` mới — đó là long-lived (60 ngày). Dùng cái này cho `FB_PAGE_ACCESS_TOKEN`.

### 2.5. Cấp quyền (Permissions and Features)
- Sidebar → **App review → Permissions and Features**
- Yêu cầu các quyền sau (advanced access nếu app live, nếu chỉ test thì standard access đủ):
  - `pages_messaging`
  - `pages_manage_posts`
  - `pages_manage_engagement`
  - `pages_read_engagement`
  - `pages_show_list`
  - `read_insights`

### 2.6. Verify token (tự đặt)
Đặt một chuỗi random bất kỳ cho `FB_VERIFY_TOKEN` (ví dụ: `my_secret_verify_2026`). Sẽ dùng ở bước 4.

---

## 3. Anthropic API key

- Vào https://console.anthropic.com/settings/keys
- Create Key → copy → điền `ANTHROPIC_API_KEY`
- Nạp $5-10 để bắt đầu

**Đổi model để tiết kiệm chi phí** (trong `.env`):
- `claude-opus-4-7` — mặc định, thông minh nhất, $5/$25 per 1M tokens
- `claude-sonnet-4-6` — rẻ hơn ~5x ($3/$15), vẫn rất tốt cho chatbot
- `claude-haiku-4-5` — rẻ nhất ($1/$5), nhanh nhất, dùng cho fanpage volume cao

---

## 4. Deploy lên Render (24/7 miễn phí)

### 4.1. Push code lên GitHub
```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/HuuTriet/fb-page-bot.git
git push -u origin main
```

### 4.2. Tạo Web Service trên Render
- https://render.com → New → Web Service → Connect repo
- **Build command**: `npm install`
- **Start command**: `npm start`
- **Environment**: chọn Free
- **Environment variables**: copy hết từ `.env` của bạn lên (Render dashboard)

Sau khi deploy thành công, Render cấp 1 URL kiểu `https://fb-page-bot.onrender.com`.

### 4.3. Đăng ký webhook với Facebook
- Quay lại Facebook App → **Messenger → Settings**
- Mục **Webhooks** → **Add Callback URL**:
  - **Callback URL**: `https://fb-page-bot.onrender.com/webhook`
  - **Verify Token**: giá trị `FB_VERIFY_TOKEN` bạn đặt ở bước 2.6
- Bấm **Verify and Save** — nếu xanh là OK
- Subscribe events: tick `messages`, `messaging_postbacks`, `feed` → Save
- Phần **Webhooks → Page** → Subscribe fanpage của bạn

---

## 5. API quản trị

Tất cả endpoint `/admin/*` cần header `Authorization: Bearer <ADMIN_TOKEN>`.

### Đăng bài theo lịch
```bash
curl -X POST https://fb-page-bot.onrender.com/admin/posts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Chào buổi sáng cả nhà!",
    "publishAt": "2026-05-06T08:00:00+07:00"
  }'
```

### Xem danh sách bài đã lên lịch
```bash
curl https://fb-page-bot.onrender.com/admin/posts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Xóa bài đã lên lịch
```bash
curl -X DELETE https://fb-page-bot.onrender.com/admin/posts/{id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Bật/tắt tính năng
```bash
curl -X PATCH https://fb-page-bot.onrender.com/admin/settings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "autoReplyMessenger": true,
      "autoReplyComments": false,
      "hideToxicComments": true,
      "scheduledPosts": true
    }
  }'
```

### Đổi prompt AI
```bash
curl -X PATCH https://fb-page-bot.onrender.com/admin/settings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messengerPrompt": "Bạn là trợ lý của shop ABC. Tư vấn về sản phẩm điện tử...",
    "commentPrompt": "Trả lời comment ngắn gọn dưới 150 ký tự..."
  }'
```

---

## 6. Endpoint thống kê

```bash
# Stats fanpage tổng (impressions, engagements, fans)
curl https://fb-page-bot.onrender.com/analytics/page

# 10 bài gần nhất
curl https://fb-page-bot.onrender.com/analytics/posts

# Stats chi tiết 1 bài
curl https://fb-page-bot.onrender.com/analytics/posts/{post_id}
```

---

## 7. Lưu ý

- **Render Free tier** sleep sau 15 phút không có request. Webhook ping của Facebook sẽ tự đánh thức (mất ~30s lần đầu). Nếu cần luôn awake, upgrade $7/tháng hoặc dùng UptimeRobot ping mỗi 10 phút.
- **Long-lived token hết hạn 60 ngày** — set lịch nhắc đổi token, hoặc viết script tự refresh.
- **Data lưu ở `data/*.json`** — Render Free không có persistent disk, restart sẽ mất scheduled posts. Nếu nghiêm túc, đổi sang SQLite + persistent disk ($1/tháng) hoặc Postgres free.
- **Rate limit Facebook**: 200 calls/hour/user. Bot tránh spam reply tự động vào comment của chính page.
