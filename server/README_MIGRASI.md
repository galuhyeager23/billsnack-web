# BillSnack Server - Migrasi ke Supabase

## ✅ Yang Sudah Dilakukan

### 1. Perubahan Dependencies

- ✅ Menghapus `mysql2` dari package.json
- ✅ Menambahkan `@supabase/supabase-js` v2.39.0

### 2. Konfigurasi Baru

- ✅ Membuat `supabase.js` - file konfigurasi Supabase client
- ✅ Update `.env` dan `.env.example` dengan variabel Supabase
- ✅ Menghapus variabel database MySQL lama

### 3. File yang Sudah Dikonversi

- ✅ `routes/auth.js` - Login, Register, Update Profile
- ✅ `index.js` - Main server file dengan Supabase client

### 4. File yang Dihapus (Tidak Diperlukan)

- ✅ `db.js` - Diganti dengan `supabase.js`
- ✅ `docker-compose.yml` - Tidak perlu database lokal
- ✅ `models/*.sql` - Schema dikelola di Supabase Dashboard
- ✅ `scripts/apply_*.ps1` - Migration scripts untuk MySQL
- ✅ `setup-bot-security.sh` - Bash script untuk MySQL

## ⚠️ PENTING: File Routes Yang Masih Perlu Dikonversi

File-file berikut **MASIH MENGGUNAKAN MySQL** dan perlu dikonversi ke Supabase:

### Routes (Priority Tinggi)

1. **`routes/products.js`** - CRUD produk, fitur reseller
2. **`routes/orders.js`** - Create order, tracking, status update
3. **`routes/admin.js`** - Admin dashboard, user management
4. **`routes/reviews.js`** - Product reviews
5. **`routes/reseller.js`** - Reseller features
6. **`routes/notifications.js`** - Notification system
7. **`routes/uploads.js`** - File uploads
8. **`routes/telegram.js`** - Telegram bot integration
9. **`routes/telegramReseller.js`** - Reseller telegram bot
10. **`routes/telegramRegistration.js`** - Registration via telegram

### Services (Priority Medium)

1. **`services/notificationService.js`**
2. **`services/telegramPolling.js`**
3. **`services/resellerTelegramPolling.js`**
4. **`services/telegramCommands.js`**
5. **`services/resellerTelegramCommands.js`**
6. **`services/telegramService.js`**
7. **`services/trackingService.js`**

### Scripts (Optional)

- `scripts/seed_admin.js`
- `scripts/seed_purchase_for_review.js`
- `scripts/e2e_create_product.js`
- `scripts/smoke_review_flow.js`
- `scripts/tracking_poller.js`
- `scripts/apply_reviews_migration.js`
- `scripts/migrate_and_check_in_stock.js`

## 📋 Langkah-Langkah Setup

### 1. Install Dependencies

```bash
cd e:\bilsnack\billsnack-web\server
npm install
```

### 2. Konfigurasi Supabase

#### A. Dapatkan Kredensial Supabase

1. Login ke https://supabase.com/dashboard
2. Pilih atau buat project baru
3. Pergi ke **Settings > API**
4. Copy:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **Project API Key** (anon/public key)

#### B. Update File .env

Buka file `e:\bilsnack\billsnack-web\server\.env` dan ganti:

```env
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_KEY=your-actual-anon-key
```

**CATATAN:** API key yang Anda berikan (`sb_publishable_OYsR8Q1MK24OCGL95AwHsA_wmP-fFPA`) tampaknya tidak lengkap. Key Supabase biasanya lebih panjang dan dimulai dengan `eyJ...`

### 3. Setup Database Schema di Supabase

#### Buka SQL Editor di Supabase Dashboard

**Settings > SQL Editor > New Query**

Jalankan query berikut untuk membuat tabel:

```sql
-- Users Table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  phone TEXT,
  gender TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  province TEXT,
  profile_image TEXT,
  profile_image_url TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  category TEXT,
  images JSONB,
  original_price NUMERIC,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  colors JSONB,
  in_stock BOOLEAN DEFAULT true,
  reseller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  seller_name TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  payment_method TEXT,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Menunggu',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  total_price NUMERIC NOT NULL,
  selected_options JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reseller Profiles Table
CREATE TABLE reseller_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  store_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reseller Connections Table
CREATE TABLE reseller_connections (
  id BIGSERIAL PRIMARY KEY,
  user_a BIGINT REFERENCES users(id) ON DELETE CASCADE,
  user_b BIGINT REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'connected',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);

-- Telegram Users Table
CREATE TABLE telegram_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  chat_id TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_reseller ON products(reseller_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reseller_profiles_user ON reseller_profiles(user_id);
```

#### Nonaktifkan Row Level Security (RLS)

Karena menggunakan service key dari backend, nonaktifkan RLS:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users DISABLE ROW LEVEL SECURITY;
```

**ATAU** buat policy yang mengizinkan semua operasi untuk service role:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy untuk service role
CREATE POLICY "Service role can do everything" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ulangi untuk semua tabel
```

### 4. Seed Data Admin (Optional)

Buat user admin pertama:

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
  'admin@billsnack.id',
  '$2b$10$...', -- Gunakan bcrypt hash untuk password Anda
  'Admin',
  'BillSnack',
  'admin'
);
```

Untuk generate password hash, gunakan:

```bash
node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
```

### 5. Testing Koneksi

```bash
npm start
```

Cek health endpoint:

```bash
curl http://localhost:4000/health
```

Output yang diharapkan:

```json
{
  "ok": true,
  "database": "connected",
  "provider": "supabase"
}
```

## 🔧 Konversi File Routes Sisanya

Untuk setiap file route yang masih menggunakan MySQL, ikuti pola ini:

### Import Statement

```javascript
// BEFORE (MySQL)
const pool = require("../db");

// AFTER (Supabase)
const supabase = require("../supabase");
```

### Query Patterns

Lihat file `SUPABASE_MIGRATION.md` untuk contoh lengkap konversi query.

## 📝 Checklist Konversi

Gunakan checklist ini saat mengkonversi setiap file:

- [ ] Ganti `require('../db')` dengan `require('../supabase')`
- [ ] Ganti `pool.execute()` dengan Supabase query builder
- [ ] Ganti `pool.query()` dengan Supabase query builder
- [ ] Hapus array destructuring `[rows]` dan `[result]`
- [ ] Gunakan `.single()` untuk query yang mengharapkan 1 row
- [ ] Gunakan `.select()` untuk SELECT queries
- [ ] Gunakan `.insert()` untuk INSERT queries
- [ ] Gunakan `.update()` untuk UPDATE queries
- [ ] Gunakan `.delete()` untuk DELETE queries
- [ ] Handle error dengan `{ data, error }` pattern
- [ ] Test endpoint setelah konversi

## 🐛 Troubleshooting

### Error: "Invalid API key"

- Pastikan `SUPABASE_KEY` di `.env` adalah **anon/public key** yang benar
- Cek di Supabase Dashboard > Settings > API

### Error: "relation does not exist"

- Tabel belum dibuat di Supabase
- Jalankan SQL schema di SQL Editor

### Error: "permission denied for table"

- RLS mungkin aktif dan memblokir akses
- Nonaktifkan RLS atau buat policy yang sesuai

### Error: "Failed to fetch"

- `SUPABASE_URL` salah atau tidak diset
- Cek koneksi internet

## 📞 Support

Jika mengalami kesulitan:

1. Cek dokumentasi Supabase: https://supabase.com/docs
2. Cek file `SUPABASE_MIGRATION.md` untuk contoh query
3. Jalankan `npm start` dan lihat error di console

## 🎯 Next Steps

1. **Install dependencies**: `npm install`
2. **Update .env** dengan Supabase credentials yang benar
3. **Setup database schema** di Supabase Dashboard
4. **Konversi file routes** satu per satu menggunakan pola di `SUPABASE_MIGRATION.md`
5. **Test setiap endpoint** setelah konversi

---

**Catatan Penting:** Server saat ini hanya akan berfungsi untuk endpoint `/api/auth/*` karena file routes lainnya masih menggunakan MySQL. Anda perlu mengkonversi semua file routes agar aplikasi berfungsi penuh.
