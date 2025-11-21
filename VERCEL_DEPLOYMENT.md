# 🚀 Panduan Deploy Billsnack ke Vercel dengan Supabase

Panduan lengkap untuk mendeploy aplikasi Billsnack ke Vercel dengan tetap menggunakan Supabase sebagai database.

## 📋 Prerequisites

1. Akun [Vercel](https://vercel.com) (gratis)
2. Akun [Supabase](https://supabase.com) (gratis)
3. Project Supabase yang sudah disetup dengan schema database
4. Repository GitHub dengan kode aplikasi ini

## 🎯 Langkah-Langkah Deployment

### 1️⃣ Persiapan Project

#### a. Install Dependencies Baru

```bash
npm install
```

Pastikan semua dependencies dari server sudah termasuk di root `package.json`.

#### b. Setup Supabase Database

Jika belum, jalankan script SQL schema di Supabase:

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Masuk ke **SQL Editor**
4. Copy dan paste isi file `server/setup_supabase_schema.sql`
5. Klik **Run**

### 2️⃣ Push ke GitHub

Pastikan semua file sudah di-commit dan push ke GitHub:

```bash
git add .
git commit -m "Setup for Vercel deployment"
git push origin main
```

### 3️⃣ Deploy ke Vercel

#### Opsi A: Via Vercel Dashboard (Recommended)

1. **Login ke Vercel**

   - Buka https://vercel.com
   - Login dengan akun GitHub Anda

2. **Import Project**

   - Klik "Add New Project"
   - Pilih repository `billsnack-web`
   - Klik "Import"

3. **Configure Project**

   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (otomatis terdeteksi)
   - **Output Directory**: `dist` (otomatis terdeteksi)

4. **Setup Environment Variables**

   Klik "Environment Variables" dan tambahkan semua variabel berikut:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   JWT_SECRET=your-strong-secret-key
   SALT_ROUNDS=10
   ADMIN_EMAIL=admin@yourdomain.com
   CORS_ORIGIN=https://your-app.vercel.app
   NODE_ENV=production
   ```

   **Cara mendapatkan Supabase credentials:**

   - Buka Supabase Dashboard
   - Pilih project Anda
   - Masuk ke **Settings** > **API**
   - Copy `URL` dan `anon/public` key

   **Generate JWT Secret:**

   ```bash
   # Di terminal PowerShell
   [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   ```

5. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build selesai (2-5 menit)
   - Setelah selesai, Anda akan mendapat URL deployment

#### Opsi B: Via Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel
   ```

4. **Tambahkan Environment Variables**

   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_KEY
   vercel env add JWT_SECRET
   vercel env add SALT_ROUNDS
   vercel env add ADMIN_EMAIL
   vercel env add CORS_ORIGIN
   vercel env add NODE_ENV
   ```

5. **Deploy ke Production**
   ```bash
   vercel --prod
   ```

### 4️⃣ Update CORS Origin

Setelah deployment pertama, update environment variable `CORS_ORIGIN`:

1. Copy URL Vercel Anda (contoh: `https://billsnack-web.vercel.app`)
2. Masuk ke Vercel Dashboard > Project Settings > Environment Variables
3. Edit `CORS_ORIGIN` dengan URL deployment Anda
4. Redeploy project

### 5️⃣ Verifikasi Deployment

1. **Test API Health**

   - Buka: `https://your-app.vercel.app/api/health`
   - Harus return: `{ "ok": true, "database": "connected", "provider": "supabase" }`

2. **Test Frontend**

   - Buka: `https://your-app.vercel.app`
   - Pastikan halaman utama muncul

3. **Test Login**
   - Coba login dengan akun yang ada
   - Pastikan authentication berfungsi

## 📝 Konfigurasi Tambahan

### Domain Custom (Opsional)

1. Buka Vercel Dashboard > Project > Settings > Domains
2. Tambahkan domain custom Anda
3. Ikuti instruksi DNS dari Vercel
4. Update `CORS_ORIGIN` dengan domain baru

### Telegram Bot Setup (Opsional)

⚠️ **Penting**: Telegram bot dengan polling tidak bekerja di Vercel (serverless).

Untuk menggunakan Telegram bot di Vercel, Anda perlu:

1. **Gunakan Webhooks** (bukan polling)
2. Buat endpoint webhook di `api/telegram-webhook.js`
3. Setup webhook ke Telegram:
   ```bash
   curl -F "url=https://your-app.vercel.app/api/telegram-webhook" \
        https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
   ```

**Atau** deploy bot secara terpisah di platform yang support long-running processes (Railway, Render, dll).

### File Upload dengan Supabase Storage

Untuk production, sebaiknya gunakan Supabase Storage daripada filesystem:

1. **Enable Storage di Supabase**

   - Buka Supabase Dashboard > Storage
   - Buat bucket baru: `product-images`

2. **Update Upload Route**

   - Modifikasi `server/routes/uploads.js`
   - Gunakan Supabase Storage API

3. **Update Image URLs**
   - URL akan berubah dari `/uploads/...` ke URL Supabase Storage

## 🔧 Troubleshooting

### Error: "Database connection failed"

**Solusi:**

1. Cek `SUPABASE_URL` dan `SUPABASE_KEY` sudah benar
2. Pastikan Supabase project masih aktif
3. Cek Supabase dashboard untuk service status

### Error: "CORS policy"

**Solusi:**

1. Pastikan `CORS_ORIGIN` berisi URL Vercel Anda yang benar
2. Redeploy setelah update environment variable
3. Clear browser cache

### API Routes tidak bekerja

**Solusi:**

1. Cek `vercel.json` ada di root project
2. Pastikan file `api/index.js` ada
3. Cek logs di Vercel Dashboard > Deployments > (pilih deployment) > Functions

### Build gagal

**Solusi:**

1. Cek error message di Vercel build logs
2. Test build locally: `npm run build`
3. Pastikan semua dependencies ada di `package.json`

## 📊 Monitoring & Logs

1. **Vercel Dashboard**

   - Buka project > Deployments
   - Klik deployment terbaru
   - Tab "Functions" untuk serverless logs
   - Tab "Build" untuk build logs

2. **Supabase Dashboard**
   - Database > Logs untuk query logs
   - Auth > Logs untuk authentication logs

## 🔄 Automatic Deployments

Vercel otomatis deploy setiap push ke GitHub:

- Push ke `main` branch → Deploy ke Production
- Push ke branch lain → Deploy Preview URL
- Pull Request → Deploy Preview URL

Disable jika tidak mau:

- Vercel Dashboard > Project > Settings > Git
- Toggle "Production Branch" atau "Preview Branches"

## 💰 Biaya

- **Vercel Free Tier**:

  - 100 GB Bandwidth/bulan
  - 100 GB-Hours serverless function execution
  - Unlimited deployments

- **Supabase Free Tier**:
  - 500 MB Database space
  - 1 GB File storage
  - 50,000 monthly active users

Cukup untuk aplikasi small-medium scale!

## 🆘 Support

Jika ada masalah:

1. Cek dokumentasi resmi [Vercel](https://vercel.com/docs) dan [Supabase](https://supabase.com/docs)
2. Cek logs di Vercel Dashboard
3. Test API endpoints manual dengan Postman/curl

## ✅ Checklist Deployment

- [ ] Database schema sudah setup di Supabase
- [ ] Admin user sudah dibuat di database
- [ ] Environment variables sudah diset di Vercel
- [ ] Project sudah di-push ke GitHub
- [ ] Deploy pertama berhasil
- [ ] CORS_ORIGIN sudah diupdate dengan URL Vercel
- [ ] Health check endpoint berfungsi (`/api/health`)
- [ ] Login/Register berfungsi
- [ ] CRUD products berfungsi
- [ ] Admin dashboard accessible
- [ ] (Opsional) Custom domain sudah disetup
- [ ] (Opsional) Telegram webhook sudah disetup

---

🎉 **Selamat! Aplikasi Billsnack Anda sekarang live di Vercel!**
