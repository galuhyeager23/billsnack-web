# Seller Name Migration

## Deskripsi

Migration ini menambahkan kolom `seller_name` ke tabel `products` untuk menyimpan nama toko/penjual admin. Sebelumnya, nama toko hanya bisa diambil dari `reseller_profiles` untuk produk reseller, namun produk admin tidak memiliki tempat penyimpanan nama toko.

## Perubahan Database

### Kolom Baru

- **seller_name** (VARCHAR(255), DEFAULT NULL): Menyimpan nama toko/penjual untuk produk

### Update Data

- Semua produk admin existing (reseller_id IS NULL) akan otomatis ter-set `seller_name = 'BillSnack Store'`

## Cara Menjalankan Migration

### Menggunakan Script PowerShell (Recommended)

```powershell
cd server
.\scripts\apply_seller_name_migration.ps1
```

### Manual via MySQL CLI

```bash
cd server
mysql -h localhost -u root -p billsnack < models/add_seller_name_to_products.sql
```

### Via phpMyAdmin

1. Buka phpMyAdmin
2. Pilih database `billsnack`
3. Klik tab "SQL"
4. Copy-paste isi file `models/add_seller_name_to_products.sql`
5. Klik "Go"

## Perubahan Backend

### Admin Routes (`server/routes/admin.js`)

- **POST /api/admin/products**: Sekarang menerima dan menyimpan field `sellerName`
- **PUT /api/admin/products/:id**: Sekarang menerima dan update field `sellerName`
- **GET /api/admin/products**: Prioritas response: `seller_name` (dari DB) → `store_name` (reseller) → fallback

## Perubahan Frontend

### Admin Product Form (`src/admin/AdminProductFormPage.jsx`)

- Menambahkan input field "Nama Toko" di form produk
- Default value: "BillSnack Store"
- Field akan tersimpan ke database saat create/update produk

## Testing

1. Jalankan migration
2. Restart server backend
3. Login sebagai admin
4. Buat produk baru dengan nama toko custom
5. Verifikasi nama toko muncul di:
   - Admin product list
   - Product detail page
   - Product cards di homepage/shop

## Rollback

Jika perlu rollback:

```sql
ALTER TABLE `products` DROP COLUMN `seller_name`;
```

## Catatan

- Migration ini aman untuk production (menambah kolom nullable)
- Data existing tidak akan rusak
- Nama toko reseller tetap diambil dari `reseller_profiles.store_name`
- Nama toko admin sekarang disimpan di `products.seller_name`
