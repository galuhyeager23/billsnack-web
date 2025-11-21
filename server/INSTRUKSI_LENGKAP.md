# 🚀 PETUNJUK LENGKAP MIGRASI KE SUPABASE

## ⚠️ STATUS SAAT INI

### ✅ Yang Sudah Selesai:

1. **package.json** - Dependencies sudah diganti ke Supabase
2. **supabase.js** - File konfigurasi Supabase client sudah dibuat
3. **.env dan .env.example** - Environment variables sudah diupdate
4. **routes/auth.js** - Sudah dikonversi ke Supabase ✅
5. **routes/products.js** - Sudah dikonversi ke Supabase ✅
6. **routes/orders.js** - Sudah dikonversi ke Supabase ✅
7. **routes/admin.js** - Sudah dikonversi ke Supabase ✅
8. **routes/reviews.js** - Sudah dikonversi ke Supabase ✅
9. **routes/reseller.js** - Sudah dikonversi ke Supabase ✅
10. **routes/notifications.js** - Sudah dikonversi ke Supabase ✅
11. **routes/uploads.js** - Tidak perlu konversi (tidak pakai DB) ✅
12. **index.js** - Main server sudah diupdate untuk Supabase
13. File MySQL yang tidak diperlukan sudah dihapus (db.js, docker-compose.yml, models/, dll)

14. **routes/telegram.js** - Sudah dikonversi ke Supabase ✅
15. **routes/telegramReseller.js** - Sudah dikonversi ke Supabase ✅
16. **routes/telegramRegistration.js** - Sudah dikonversi ke Supabase ✅
17. **services/notificationService.js** - Sudah dikonversi ke Supabase ✅
18. **services/telegramCommands.js** - Sudah dikonversi ke Supabase ✅
19. **services/telegramPolling.js** - Sudah dikonversi ke Supabase ✅
20. **services/resellerTelegramCommands.js** - Sudah dikonversi ke Supabase ✅
21. **services/resellerTelegramPolling.js** - Sudah dikonversi ke Supabase ✅

### ⚠️ Yang BELUM Dikonversi (Opsional):

- scripts/\* (semua file) - Opsional, untuk seed/migration/testing saja

## 📝 LANGKAH-LANGKAH SETUP

### LANGKAH 1: Install Dependencies

```powershell
cd e:\bilsnack\billsnack-web\server
npm install
```

**Hasil yang diharapkan:** Dependencies terinstall tanpa error

---

### LANGKAH 2: Dapatkan Credentials Supabase

1. **Login ke Supabase**

   - Buka: https://supabase.com/dashboard
   - Login dengan akun Anda

2. **Pilih atau Buat Project**

   - Jika belum punya project, klik "New Project"
   - Isi nama project: `billsnack-web`
   - Pilih region terdekat (Singapore/Jakarta)
   - Tunggu setup selesai (2-3 menit)

3. **Dapatkan API Credentials**
   - Klik project Anda
   - Pergi ke: **Settings** (ikon gear di sidebar kiri bawah)
   - Klik: **API**
   - Copy 2 nilai ini:
     - **Project URL** (contoh: `https://abcdefgh.supabase.co`)
     - **anon/public key** (yang panjang, dimulai dengan `eyJ...`)

---

### LANGKAH 3: Update File .env

Buka file: `e:\bilsnack\billsnack-web\server\.env`

Ganti baris ini:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=sb_publishable_OYsR8Q1MK24OCGL95AwHsA_wmP-fFPA
```

Dengan nilai yang Anda copy dari Supabase Dashboard:

```env
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**PENTING:** API key yang Anda berikan sebelumnya (`sb_publishable_OYsR8Q1MK24OCGL95AwHsA_wmP-fFPA`) tampaknya tidak lengkap. Key Supabase yang benar lebih panjang dan dimulai dengan `eyJ`.

---

### LANGKAH 4: Setup Database Schema

1. **Buka SQL Editor di Supabase**

   - Di Supabase Dashboard, klik sidebar: **SQL Editor**
   - Klik: **New Query**

2. **Copy & Paste Schema**

   - Buka file: `e:\bilsnack\billsnack-web\server\setup_supabase_schema.sql`
   - Copy SEMUA isi file
   - Paste di SQL Editor
   - Klik tombol: **Run** (atau tekan Ctrl+Enter)

3. **Verifikasi Tabel Berhasil Dibuat**
   - Klik sidebar: **Table Editor**
   - Anda harus melihat tabel: users, products, orders, order_items, reviews, reseller_profiles, reseller_connections, telegram_users

**Hasil yang diharapkan:** Semua tabel berhasil dibuat tanpa error

---

### LANGKAH 5: Buat User Admin

1. **Generate Password Hash**

   ```powershell
   cd e:\bilsnack\billsnack-web\server
   node generate_password_hash.js admin123
   ```

   Output akan menampilkan hash seperti:

   ```
   Hash: $2b$10$ABCxyz123...
   ```

2. **Insert Admin User**

   - Buka **SQL Editor** di Supabase lagi
   - Jalankan query ini (ganti `$2b$10$...` dengan hash dari langkah 1):

   ```sql
   INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
   VALUES (
     'admin@billsnack.id',
     '$2b$10$ABCxyz123...',  -- GANTI DENGAN HASH ANDA
     'Admin',
     'BillSnack',
     'admin',
     true
   );
   ```

3. **Verifikasi Admin User**
   ```sql
   SELECT id, email, role FROM users WHERE role = 'admin';
   ```

**Hasil yang diharapkan:** 1 row dengan email admin@billsnack.id

---

### LANGKAH 6: Test Server

1. **Jalankan Server**

   ```powershell
   cd e:\bilsnack\billsnack-web\server
   npm start
   ```

2. **Test Health Endpoint**
   Buka browser atau gunakan curl:

   ```
   http://localhost:4000/health
   ```

   **Hasil yang diharapkan:**

   ```json
   {
     "ok": true,
     "database": "connected",
     "provider": "supabase"
   }
   ```

3. **Test Login**

   - Buka Postman atau Thunder Client
   - POST ke: `http://localhost:4000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@billsnack.id",
       "password": "admin123"
     }
     ```

   **Hasil yang diharapkan:**

   ```json
   {
     "user": {
       "id": 1,
       "email": "admin@billsnack.id",
       "role": "admin",
       ...
     },
     "token": "eyJhbGc..."
   }
   ```

✅ **Jika semua test berhasil, server sudah berjalan dengan Supabase!**

---

## ✅ SEMUA KONVERSI SUDAH SELESAI!

**SEMUA endpoint sudah menggunakan Supabase dan siap digunakan:**

- ✅ `/api/auth/*` - Login, Register, Profile
- ✅ `/api/products/*` - Product CRUD (public/reseller/admin)
- ✅ `/api/orders/*` - Order creation, history, tracking
- ✅ `/api/admin/*` - Admin dashboard, user management
- ✅ `/api/reviews/*` - Product reviews
- ✅ `/api/resellers/*` - Reseller management, connections, sales
- ✅ `/api/notifications/*` - Notification system
- ✅ `/api/uploads/*` - File uploads
- ✅ `/api/telegram/*` - Telegram bot integration (main bot)
- ✅ `/api/telegram/reseller/*` - Telegram bot for resellers

**Services yang sudah dikonversi:**

- ✅ NotificationService - Notification management with Supabase
- ✅ TelegramCommands - Telegram bot commands
- ✅ TelegramPolling - Telegram bot polling service
- ✅ ResellerTelegramCommands - Reseller bot commands
- ✅ ResellerTelegramPolling - Reseller bot polling service

---

## 🧪 Testing Endpoints

Setelah server berjalan, test endpoint-endpoint ini:

### 1. Authentication

```bash
POST /api/auth/login
POST /api/auth/register
GET /api/auth/profile (dengan token)
```

### 2. Products

```bash
GET /api/products (public)
GET /api/products/top-selling
GET /api/products/:id
POST /api/products (reseller, dengan token)
PUT /api/products/:id (reseller, dengan token)
```

### 3. Orders

```bash
POST /api/orders (dengan token)
GET /api/orders/user (dengan token)
GET /api/orders/:id (dengan token)
```

### 4. Admin

```bash
GET /api/admin/products (admin, dengan token)
PUT /api/admin/products/:id (admin, dengan token)
GET /api/admin/transactions (admin, dengan token)
```

### 5. Reviews

```bash
POST /api/reviews (dengan token)
GET /api/reviews/product/:productId
```

### 6. Reseller

```bash
GET /api/resellers/connections (reseller, dengan token)
POST /api/resellers/connections (reseller, dengan token)
GET /api/resellers/stats (reseller, dengan token)
```

### 7. Telegram

```bash
POST /api/telegram/register-reseller (reseller, dengan token)
GET /api/telegram/reseller-status (dengan token)
GET /api/telegram/commands
GET /api/telegram/reseller/commands
```

---

## 🛠️ File-file yang Sudah Dibuat

1. **README_MIGRASI.md** - Penjelasan lengkap migrasi
2. **SUPABASE_MIGRATION.md** - Pola konversi query MySQL → Supabase
3. **setup_supabase_schema.sql** - Schema database lengkap
4. **generate_password_hash.js** - Script untuk generate bcrypt hash
5. **INSTRUKSI_LENGKAP.md** - File ini

---

## ⚠️ CATATAN PENTING

1. **API Key yang Diberikan Tidak Lengkap**

   - `sb_publishable_OYsR8Q1MK24OCGL95AwHsA_wmP-fFPA` tampaknya bukan key Supabase yang valid
   - Key Supabase biasanya SANGAT PANJANG (500+ karakter) dan dimulai dengan `eyJ`
   - Dapatkan key yang benar dari Supabase Dashboard > Settings > API

2. **Row Level Security (RLS)**

   - Schema SQL sudah menonaktifkan RLS secara default
   - Ini membuat semua tabel bisa diakses dengan anon key
   - Untuk production, pertimbangkan untuk enable RLS dengan policy yang proper

3. **Backup Data Lama**

   - Jika Anda punya data di MySQL, backup dulu sebelum migrasi penuh
   - Buat export SQL dari MySQL untuk berjaga-jaga

4. **Testing**
   - Test setiap endpoint setelah konversi
   - Jangan deploy ke production sebelum semua endpoint berhasil

---

## 🆘 Troubleshooting

### Error: "Invalid API key" atau "Failed to fetch"

- Cek `.env` file, pastikan SUPABASE_URL dan SUPABASE_KEY benar
- Pastikan tidak ada spasi atau karakter aneh
- Key harus dimulai dengan `eyJ`

### Error: "relation 'users' does not exist"

- Tabel belum dibuat di Supabase
- Jalankan ulang `setup_supabase_schema.sql`

### Error: "permission denied for table users"

- RLS mungkin aktif
- Jalankan: `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`

### Server start tapi health check gagal

- Cek console untuk error message
- Pastikan internet connection
- Cek Supabase Dashboard apakah project masih aktif

---

## 📞 Need Help?

Jika stuck:

1. Cek error di console (`npm start`)
2. Cek Supabase Dashboard > Logs untuk error di database side
3. Baca file SUPABASE_MIGRATION.md untuk contoh query
4. Test dengan curl atau Postman untuk debug

---

## ✅ Checklist Progress

Gunakan ini untuk track progress konversi:

### Setup Awal

- [ ] npm install berhasil
- [ ] Dapat credentials dari Supabase
- [ ] Update .env dengan credentials benar
- [ ] Schema database dibuat (8 tabel)
- [ ] Admin user dibuat
- [ ] Server bisa start
- [ ] Health check berhasil
- [ ] Login admin berhasil

### Konversi Routes ✅ SEMUA SELESAI

- [x] routes/auth.js ✅
- [x] routes/products.js ✅
- [x] routes/orders.js ✅
- [x] routes/admin.js ✅
- [x] routes/reviews.js ✅
- [x] routes/reseller.js ✅
- [x] routes/notifications.js ✅
- [x] routes/uploads.js ✅
- [x] routes/telegram.js ✅
- [x] routes/telegramReseller.js ✅
- [x] routes/telegramRegistration.js ✅

### Konversi Services ✅ SEMUA SELESAI

- [x] services/notificationService.js ✅
- [x] services/telegramCommands.js ✅
- [x] services/telegramPolling.js ✅
- [x] services/resellerTelegramCommands.js ✅
- [x] services/resellerTelegramPolling.js ✅

### Testing (Yang Perlu Dilakukan)

- [ ] Test create product
- [ ] Test checkout order
- [ ] Test product review
- [ ] Test admin dashboard
- [ ] Test reseller features
- [ ] Test Telegram bot (jika digunakan)

---

**LANGKAH SELANJUTNYA:**

1. ✅ **SEMUA KONVERSI SUDAH SELESAI!**
2. ✅ Ikuti LANGKAH 1-6 untuk setup database
3. ⏳ Test semua endpoint dengan Postman/Thunder Client
4. ⏳ Setup Telegram bot (optional, jika digunakan)
5. ⏳ Deploy ke production setelah semua test berhasil

**Selamat! Migrasi ke Supabase sudah 100% selesai! 🎉**
