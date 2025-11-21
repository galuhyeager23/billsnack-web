# Migrasi ke Supabase

## Perubahan Utama

### 1. Dependencies

- ✅ Dihapus: `mysql2`
- ✅ Ditambahkan: `@supabase/supabase-js`

### 2. Configuration

- ✅ File `supabase.js` menggantikan `db.js`
- ✅ Environment variables diupdate di `.env.example`

## Pola Konversi Query

### SELECT Queries

**MySQL (pool.execute)**

```javascript
const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
  email,
]);
const user = rows[0];
```

**Supabase**

```javascript
const { data: user, error } = await supabase
  .from("users")
  .select("*")
  .eq("email", email)
  .single();
```

### INSERT Queries

**MySQL**

```javascript
const [result] = await pool.execute(
  "INSERT INTO products (name, price) VALUES (?, ?)",
  [name, price]
);
const id = result.insertId;
```

**Supabase**

```javascript
const { data, error } = await supabase
  .from("products")
  .insert({ name, price })
  .select()
  .single();
const id = data.id;
```

### UPDATE Queries

**MySQL**

```javascript
await pool.execute("UPDATE products SET price = ? WHERE id = ?", [price, id]);
```

**Supabase**

```javascript
const { error } = await supabase
  .from("products")
  .update({ price })
  .eq("id", id);
```

### DELETE Queries

**MySQL**

```javascript
await pool.execute("DELETE FROM products WHERE id = ?", [id]);
```

**Supabase**

```javascript
const { error } = await supabase.from("products").delete().eq("id", id);
```

### JOIN Queries

**MySQL**

```javascript
const [rows] = await pool.execute(
  `
  SELECT p.*, u.first_name, u.last_name 
  FROM products p 
  LEFT JOIN users u ON p.reseller_id = u.id
  WHERE p.id = ?
`,
  [id]
);
```

**Supabase**

```javascript
const { data, error } = await supabase
  .from("products")
  .select(
    `
    *,
    users!reseller_id (
      first_name,
      last_name
    )
  `
  )
  .eq("id", id)
  .single();
```

### COUNT & Aggregate

**MySQL**

```javascript
const [[result]] = await pool.execute(
  "SELECT COUNT(*) as cnt, AVG(rating) as avg FROM reviews WHERE product_id = ?",
  [productId]
);
```

**Supabase**

```javascript
const { count } = await supabase
  .from("reviews")
  .select("*", { count: "exact", head: true })
  .eq("product_id", productId);

const { data } = await supabase
  .from("reviews")
  .select("rating")
  .eq("product_id", productId);
const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
```

## Files yang Sudah Dikonversi

- ✅ `routes/auth.js` - Sudah dikonversi lengkap

## Files yang Perlu Dikonversi

- ⏳ `routes/products.js`
- ⏳ `routes/orders.js`
- ⏳ `routes/admin.js`
- ⏳ `routes/reviews.js`
- ⏳ `routes/reseller.js`
- ⏳ `routes/notifications.js`
- ⏳ `routes/telegram.js`
- ⏳ `routes/telegramReseller.js`
- ⏳ `routes/telegramRegistration.js`
- ⏳ `routes/uploads.js`
- ⏳ `index.js`
- ⏳ `services/*`

## Files yang Akan Dihapus

- ❌ `db.js` (diganti dengan `supabase.js`)
- ❌ `docker-compose.yml`
- ❌ `models/*.sql`
- ❌ `scripts/apply_*.ps1`
- ❌ `setup-bot-security.sh`

## Setup Supabase

### 1. Dapatkan URL Project Anda

Kunjungi: https://supabase.com/dashboard/project/_/settings/api

### 2. Update .env

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=sb_publishable_OYsR8Q1MK24OCGL95AwHsA_wmP-fFPA
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Jalankan Server

```bash
npm start
```

## Database Schema

Anda perlu membuat tabel-tabel berikut di Supabase:

### users

- id (int8, primary key, auto-increment)
- email (text, unique)
- password_hash (text)
- first_name (text)
- last_name (text)
- username (text)
- phone (text)
- gender (text)
- address (text)
- postal_code (text)
- city (text)
- province (text)
- profile_image (text)
- profile_image_url (text)
- role (text)
- is_active (boolean)
- created_at (timestamp)

### products

- id (int8, primary key, auto-increment)
- name (text)
- description (text)
- price (numeric)
- stock (int4)
- category (text)
- images (jsonb)
- original_price (numeric)
- rating (numeric)
- review_count (int4)
- colors (jsonb)
- in_stock (boolean)
- reseller_id (int8, foreign key -> users.id)
- seller_name (text)
- is_approved (boolean)
- created_at (timestamp)

### orders

- id (int8, primary key, auto-increment)
- order_number (text)
- user_id (int8, foreign key -> users.id)
- email (text)
- name (text)
- phone (text)
- address (text)
- city (text)
- province (text)
- postal_code (text)
- payment_method (text)
- subtotal (numeric)
- discount (numeric)
- delivery_fee (numeric)
- total (numeric)
- status (text)
- metadata (jsonb)
- created_at (timestamp)

### order_items

- id (int8, primary key, auto-increment)
- order_id (int8, foreign key -> orders.id)
- product_id (int8, foreign key -> products.id)
- name (text)
- unit_price (numeric)
- quantity (int4)
- total_price (numeric)
- selected_options (jsonb)
- created_at (timestamp)

### reviews

- id (int8, primary key, auto-increment)
- product_id (int8, foreign key -> products.id)
- user_id (int8, foreign key -> users.id)
- rating (int4)
- comment (text)
- created_at (timestamp)

### reseller_profiles

- id (int8, primary key, auto-increment)
- user_id (int8, foreign key -> users.id, unique)
- store_name (text)
- phone (text)
- address (text)
- created_at (timestamp)

### reseller_connections

- id (int8, primary key, auto-increment)
- user_a (int8, foreign key -> users.id)
- user_b (int8, foreign key -> users.id)
- status (text)
- created_at (timestamp)

### telegram_users

- id (int8, primary key, auto-increment)
- telegram_id (text, unique)
- chat_id (text)
- username (text)
- first_name (text)
- last_name (text)
- user_id (int8, foreign key -> users.id)
- created_at (timestamp)

## Notes

1. **Transactions**: Supabase tidak memiliki transaction seperti MySQL `BEGIN/COMMIT`. Gunakan RPC functions untuk operasi kompleks yang memerlukan atomicity.

2. **JSON Fields**: Supabase menggunakan `jsonb` type untuk menyimpan JSON, query dengan `.select('images')` akan otomatis parse JSON.

3. **Auto-increment**: Di Supabase, gunakan `identity` atau `sequence` untuk auto-increment fields.

4. **Foreign Keys**: Pastikan relasi foreign key sudah diset di Supabase dashboard.

5. **Row Level Security (RLS)**: Nonaktifkan RLS untuk tabel atau buat policies yang sesuai untuk API key.
