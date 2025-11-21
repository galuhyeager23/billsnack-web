# 🚀 Billsnack E-Commerce Platform

Platform e-commerce lengkap untuk produk snack dengan backend Supabase dan frontend React + Vite.

## ✅ Status Migrasi

**SEMUA konversi dari MySQL ke Supabase sudah selesai 100%!**

### Backend (Server)

✅ 11 Routes files dikonversi ke Supabase  
✅ 5 Services files dikonversi ke Supabase  
✅ Dokumentasi lengkap tersedia  
✅ Postman collection siap digunakan

### Frontend

✅ API configuration terpusat (`src/config/api.js`)  
✅ AuthContext diupdate untuk Supabase backend  
✅ Proxy Vite dikonfigurasi  
✅ Environment variables disetup

---

## 📋 Prerequisites

- **Node.js** v18+ dan npm
- **Supabase Account** (gratis di https://supabase.com)
- **Git** (untuk clone repository)

---

## 🔧 Setup Backend (Server)

### 1. Install Dependencies

```powershell
cd server
npm install
```

### 2. Setup Supabase

1. **Login ke Supabase Dashboard**

   - Buka https://supabase.com/dashboard
   - Buat project baru atau gunakan yang sudah ada

2. **Dapatkan Credentials**

   - Pergi ke **Settings** → **API**
   - Copy **Project URL** dan **anon/public key**

3. **Update `.env`**

Edit file `server/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
PORT=4000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
SALT_ROUNDS=10

# Admin
ADMIN_EMAIL=admin@billsnack.id

# Telegram (Optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_RESELLER_BOT_TOKEN=your-reseller-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-chat-id

# CORS
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 3. Setup Database Schema

1. Buka **SQL Editor** di Supabase Dashboard
2. Copy semua isi file `server/setup_supabase_schema.sql`
3. Paste dan **Run** query
4. Verifikasi 8 tabel berhasil dibuat di **Table Editor**

### 4. Buat Admin User

Generate password hash:

```powershell
cd server
node generate_password_hash.js admin123
```

Copy hash yang muncul, lalu jalankan SQL di Supabase:

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@billsnack.id',
  '$2b$10$...YOUR_HASH_HERE...',
  'Admin',
  'BillSnack',
  'admin',
  true
);
```

### 5. Jalankan Server

```powershell
npm start
# atau untuk development dengan auto-reload:
npm run dev
```

Server akan berjalan di **http://localhost:4000**

### 6. Test Server

```powershell
# Health check
curl http://localhost:4000/health

# Atau buka di browser
```

Expected response:

```json
{
  "ok": true,
  "database": "connected",
  "provider": "supabase"
}
```

---

## 🎨 Setup Frontend

### 1. Install Dependencies

```powershell
cd ..  # kembali ke root folder
npm install
```

### 2. Setup Environment Variables

File `.env` sudah ada dengan konfigurasi default:

```env
VITE_API_URL=http://localhost:4000
```

Untuk production, ganti dengan URL server production Anda.

### 3. Jalankan Development Server

```powershell
npm run dev
```

Frontend akan berjalan di **http://localhost:5173**

### 4. Build untuk Production

```powershell
npm run build
```

Output akan ada di folder `dist/`

---

## 📚 Dokumentasi API

### Postman Collection

Import file `server/Billsnack_API_Postman_Collection.json` ke Postman untuk testing:

1. Buka Postman
2. Klik **Import**
3. Pilih file JSON
4. Collection siap digunakan dengan auto-save token!

### Endpoint Tersedia

**Authentication**

- POST `/api/auth/register` - Daftar user baru
- POST `/api/auth/login` - Login
- GET `/api/auth/profile` - Get profile (requires token)
- PUT `/api/auth/profile` - Update profile (requires token)

**Products**

- GET `/api/products` - List semua produk (public)
- GET `/api/products/:id` - Detail produk
- GET `/api/products/top-selling` - Produk terlaris
- POST `/api/products` - Create produk (reseller)
- PUT `/api/products/:id` - Update produk (reseller)
- DELETE `/api/products/:id` - Delete produk (reseller)
- GET `/api/products/reseller/my-products` - Produk saya (reseller)

**Orders**

- POST `/api/orders` - Buat order
- GET `/api/orders/user` - Order history
- GET `/api/orders/:id` - Detail order
- PUT `/api/orders/:id/status` - Update status (admin)
- PUT `/api/orders/:id/tracking` - Update tracking (admin)

**Reviews**

- POST `/api/reviews` - Buat review
- GET `/api/reviews/product/:productId` - Reviews produk
- PUT `/api/reviews/:id` - Update review
- DELETE `/api/reviews/:id` - Delete review

**Reseller**

- GET `/api/resellers/connections` - Koneksi reseller
- POST `/api/resellers/connections` - Tambah koneksi
- DELETE `/api/resellers/connections/:id` - Hapus koneksi
- GET `/api/resellers/stats` - Statistik penjualan
- GET `/api/resellers/sold-products` - Produk terjual

**Admin**

- GET `/api/admin/products` - Semua produk (termasuk unapproved)
- PUT `/api/admin/products/:id` - Update/approve produk
- DELETE `/api/admin/products/:id` - Delete produk
- GET `/api/admin/users` - Semua user
- POST `/api/admin/users` - Buat user
- PUT `/api/admin/users/:id` - Update user
- DELETE `/api/admin/users/:id` - Delete user
- GET `/api/admin/transactions` - Semua transaksi

**Notifications**

- GET `/api/notifications` - List notifikasi
- GET `/api/notifications/unread` - Notifikasi belum dibaca
- GET `/api/notifications/count-unread` - Hitung unread
- PUT `/api/notifications/:id/read` - Mark as read
- PUT `/api/notifications/read-all` - Mark all as read
- DELETE `/api/notifications/:id` - Delete notifikasi

**File Upload**

- POST `/api/uploads/image` - Upload gambar produk

**Telegram Bot** (Optional)

- GET `/api/telegram/commands` - Bot commands
- GET `/api/telegram/reseller/commands` - Reseller bot commands
- POST `/api/telegram/register-reseller` - Link Telegram
- GET `/api/telegram/reseller-status` - Check status
- DELETE `/api/telegram/unregister-reseller` - Unlink Telegram

---

## 🧪 Testing

### Test Login

```powershell
$body = @{ email='admin@billsnack.id'; password='admin123' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:4000/api/auth/login' -Body $body -ContentType 'application/json'
```

### Test dengan Postman

1. Import collection `Billsnack_API_Postman_Collection.json`
2. Jalankan request **"Login Admin"**
3. Token akan auto-save ke variables
4. Test endpoint lain yang memerlukan authentication

---

## 📁 Struktur Project

```
billsnack-web/
├── server/                          # Backend (Express + Supabase)
│   ├── routes/                      # API routes (11 files)
│   ├── services/                    # Business logic (5 files)
│   ├── supabase.js                  # Supabase client config
│   ├── index.js                     # Main server
│   ├── .env                         # Environment variables
│   ├── setup_supabase_schema.sql    # Database schema
│   ├── generate_password_hash.js    # Password hash generator
│   ├── INSTRUKSI_LENGKAP.md         # Panduan lengkap migrasi
│   ├── SUPABASE_MIGRATION.md        # Pola konversi query
│   └── Billsnack_API_Postman_Collection.json
│
├── src/                             # Frontend (React + Vite)
│   ├── config/
│   │   └── api.js                   # ✨ API configuration terpusat
│   ├── contexts/
│   │   ├── AuthContext.jsx          # ✅ Updated untuk Supabase
│   │   ├── CartContext.jsx
│   │   └── ProductContext.jsx
│   ├── components/
│   ├── admin/
│   ├── reseller/
│   └── ...
│
├── vite.config.js                   # Vite config dengan proxy
├── .env                             # Frontend env variables
└── package.json
```

---

## 🔒 Security Notes

### Production Checklist

- [ ] Ganti `JWT_SECRET` dengan string random yang kuat
- [ ] Enable Row Level Security (RLS) di Supabase untuk production
- [ ] Ganti admin password default
- [ ] Setup HTTPS/SSL untuk production
- [ ] Update CORS_ORIGIN dengan domain production
- [ ] Protect Supabase keys (jangan commit ke Git)
- [ ] Setup rate limiting untuk API
- [ ] Enable Supabase Auth policies

### Environment Variables

**JANGAN commit file `.env` ke Git!**

File `.env` sudah ada di `.gitignore`. Untuk production:

1. Setup environment variables di hosting platform (Vercel/Netlify/Railway)
2. Gunakan secrets management service
3. Rotate keys secara berkala

---

## 🐛 Troubleshooting

### Error: "Invalid API key" atau "Failed to fetch"

✅ **Solusi:**

- Cek file `.env` di server
- Pastikan `SUPABASE_URL` dan `SUPABASE_KEY` benar
- Key harus dimulai dengan `eyJ` (bukan `sb_publishable_...`)
- Dapatkan key yang benar dari Supabase Dashboard → Settings → API

### Error: "relation 'users' does not exist"

✅ **Solusi:**

- Tabel belum dibuat di Supabase
- Jalankan file `setup_supabase_schema.sql` di SQL Editor

### Error: "permission denied for table users"

✅ **Solusi:**

- RLS (Row Level Security) aktif
- Untuk development, disable RLS:
  ```sql
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE products DISABLE ROW LEVEL SECURITY;
  -- dst untuk semua tabel
  ```

### Server start tapi health check gagal

✅ **Solusi:**

- Cek console untuk error message
- Pastikan internet connection stabil
- Cek Supabase Dashboard apakah project masih aktif
- Verifikasi credentials di `.env`

### Frontend tidak bisa connect ke backend

✅ **Solusi:**

- Pastikan backend server berjalan di port 4000
- Cek `VITE_API_URL` di frontend `.env`
- Cek Vite proxy config di `vite.config.js`
- Clear browser cache dan restart dev server

### CORS Error

✅ **Solusi:**

- Update `CORS_ORIGIN` di server `.env`
- Untuk development: `CORS_ORIGIN=http://localhost:5173`
- Untuk multiple origins, edit `server/index.js`

---

## 📞 Support

Jika menemukan masalah:

1. Cek error di console: `npm start` (server) atau `npm run dev` (frontend)
2. Cek Supabase Dashboard → Logs untuk error di database
3. Baca dokumentasi:
   - `server/INSTRUKSI_LENGKAP.md` - Setup lengkap
   - `server/SUPABASE_MIGRATION.md` - Query patterns
4. Test dengan Postman untuk isolasi masalah

---

## 🎉 Fitur

### Untuk Customer

- ✅ Browse dan search produk
- ✅ Detail produk dengan review
- ✅ Shopping cart
- ✅ Checkout dan order
- ✅ Order history dengan tracking
- ✅ Review produk yang dibeli
- ✅ Notifikasi real-time

### Untuk Reseller

- ✅ Dashboard reseller
- ✅ CRUD produk sendiri
- ✅ Statistik penjualan
- ✅ Koneksi dengan reseller lain
- ✅ Produk yang terjual
- ✅ Telegram bot integration

### Untuk Admin

- ✅ Dashboard admin
- ✅ Approve/reject produk
- ✅ User management (CRUD)
- ✅ View semua transaksi
- ✅ Update order status & tracking
- ✅ Product management

### Technical Features

- ✅ JWT Authentication
- ✅ Role-based access (admin, reseller, user)
- ✅ File upload (images)
- ✅ Real-time notifications
- ✅ Telegram bot integration
- ✅ Order tracking system
- ✅ Product reviews & ratings
- ✅ Reseller connections network
- ✅ PostgreSQL via Supabase
- ✅ RESTful API

---

## 🚀 Deployment

### Backend (Server)

**Railway / Render / Heroku:**

1. Push code ke GitHub
2. Connect repository ke platform
3. Set environment variables
4. Deploy

**VPS (Ubuntu):**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone & setup
git clone <your-repo>
cd billsnack-web/server
npm install
npm install -g pm2

# Set environment variables
nano .env

# Start with PM2
pm2 start index.js --name billsnack-api
pm2 save
pm2 startup
```

### Frontend

**Vercel / Netlify:**

1. Push code ke GitHub
2. Import project
3. Set environment: `VITE_API_URL=https://your-api-url.com`
4. Deploy

Build command: `npm run build`  
Output directory: `dist`

---

**Selamat! Setup selesai. Happy coding! 🎉**
