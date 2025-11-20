# Fix: Add is_approved Column Migration

## Error

```
Error: Unknown column 'is_approved' in 'field list'
```

## Solusi

Kolom `is_approved` perlu ditambahkan ke tabel `products`.

## Cara Menjalankan Migration

### Via phpMyAdmin (Termudah):

1. Buka phpMyAdmin
2. Pilih database `billsnack`
3. Klik tab "SQL"
4. Copy-paste query berikut:

```sql
ALTER TABLE `products`
ADD COLUMN `is_approved` TINYINT(1) NOT NULL DEFAULT 1 AFTER `created_at`;

UPDATE `products`
SET `is_approved` = 1
WHERE `reseller_id` IS NULL;

UPDATE `products`
SET `is_approved` = 1
WHERE `reseller_id` IS NOT NULL;
```

5. Klik "Go"
6. Restart server backend

### Via MySQL CLI:

```bash
mysql -h localhost -u root -p billsnack < server/models/add_is_approved_to_products.sql
```

### Via PowerShell Script (jika ada .env):

```powershell
cd server
.\scripts\apply_is_approved_migration.ps1
```

## Verifikasi

Setelah migration berhasil, coba approve product di admin panel. Error seharusnya hilang.
