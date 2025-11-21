# 🔧 Troubleshooting: Server Tidak Terhubung di Vercel

## ✅ Perbaikan Yang Sudah Dilakukan

### 1. **API Configuration untuk Production**

- Frontend sekarang menggunakan **relative URL** (`''`) di production
- Development tetap menggunakan `http://localhost:4000`
- Vercel akan serve API dan frontend dari domain yang sama

### 2. **Vercel Build Configuration**

- Ditambahkan build untuk `api/**/*.js` menggunakan `@vercel/node`
- Ini memastikan Vercel mengenali folder `api` sebagai serverless functions

### 3. **Export Format untuk Vercel**

- `api/index.js` sekarang export dengan format yang benar
- Ditambahkan `module.exports.default` untuk kompatibilitas

---

## 🚀 Langkah Deployment

### 1. **Set Environment Variables di Vercel Dashboard**

Masuk ke: **Vercel Dashboard → Project → Settings → Environment Variables**

Tambahkan variabel berikut:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-strong-random-secret
ADMIN_EMAIL=admin@yourdomain.com
CORS_ORIGIN=https://your-app-name.vercel.app
NODE_ENV=production
SALT_ROUNDS=10
```

**PENTING:** `CORS_ORIGIN` harus sama dengan domain Vercel Anda!

### 2. **Commit dan Push Changes**

```powershell
git add .
git commit -m "Fix: API configuration for Vercel deployment"
git push origin main
```

### 3. **Vercel Auto-Deploy**

Vercel akan otomatis:

- Detect push
- Install dependencies
- Build frontend (`vite build`)
- Deploy serverless functions
- Deploy static files

### 4. **Verify Deployment**

Setelah deploy selesai, test:

```powershell
# Ganti dengan URL Vercel Anda
curl https://your-app.vercel.app/api/health
```

Expected response:

```json
{
  "ok": true,
  "database": "connected",
  "provider": "supabase",
  "timestamp": "2025-11-22T..."
}
```

---

## 🔍 Debug Steps

### 1. **Cek Function Logs**

1. Masuk ke **Vercel Dashboard**
2. Pilih project Anda
3. Tab **Deployments** → pilih latest deployment
4. Tab **Functions** → pilih `api/index.js`
5. Lihat **Logs** untuk error

### 2. **Test API Endpoint Langsung**

```powershell
# Test health check
Invoke-RestMethod -Uri "https://your-app.vercel.app/api/health"

# Test dengan detail error
Invoke-WebRequest -Uri "https://your-app.vercel.app/api/health" | Select-Object -Expand Content
```

### 3. **Cek CORS Configuration**

Buka browser DevTools (F12) → Console

Error seperti ini = CORS issue:

```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Solusi:**

- Pastikan `CORS_ORIGIN` di environment variables benar
- Redeploy setelah update

### 4. **Cek Build Logs**

Vercel Dashboard → Deployments → latest → **Build Logs**

Cari error seperti:

- `Module not found`
- `Cannot find module`
- Build failed

**Solusi:** Pastikan semua dependencies ada di root `package.json`

---

## ⚠️ Common Issues & Solutions

### Issue 1: "502 Bad Gateway" atau "Function Invocation Failed"

**Penyebab:**

- Environment variables tidak diset
- Module dependencies tidak ter-install
- Syntax error di code

**Solusi:**

```powershell
# Cek logs di Vercel Dashboard → Functions
# Pastikan semua env vars ada
# Cek package.json dependencies lengkap
```

### Issue 2: "CORS Policy Error"

**Penyebab:**

- `CORS_ORIGIN` tidak match dengan domain frontend

**Solusi:**

```powershell
# Update CORS_ORIGIN di Vercel
# Contoh: https://billsnack-web.vercel.app
# ATAU multiple domains: https://app1.vercel.app,https://app2.vercel.app
```

### Issue 3: API Routes Return 404

**Penyebab:**

- `vercel.json` routing tidak benar
- `api/index.js` tidak ter-detect sebagai serverless function

**Solusi:**

```json
// Pastikan vercel.json memiliki:
{
  "builds": [{ "src": "api/**/*.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/api/(.*)", "dest": "/api/index.js" }]
}
```

### Issue 4: Frontend Tidak Bisa Connect ke API

**Penyebab:**

- `VITE_API_URL` masih pointing ke localhost

**Solusi:**
Frontend sudah diperbaiki untuk menggunakan relative URL di production:

```javascript
// src/config/api.js
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:4000");
```

### Issue 5: Database Connection Failed

**Penyebab:**

- `SUPABASE_URL` atau `SUPABASE_KEY` salah/tidak diset

**Solusi:**

1. Buka Supabase Dashboard → Settings → API
2. Copy `Project URL` dan `anon/public key`
3. Set di Vercel environment variables
4. Redeploy

---

## 📊 Monitoring Production

### Real-time Logs

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs
```

### Function Analytics

Vercel Dashboard → Analytics:

- Execution time
- Error rate
- Invocation count
- Cold starts

### Database Performance

Supabase Dashboard → Database → Query Performance:

- Slow queries
- Connection count
- Query errors

---

## ✅ Verification Checklist

Setelah deploy, pastikan:

- [ ] `/api/health` returns `{"ok": true, "database": "connected"}`
- [ ] Login page bisa diakses
- [ ] Register user baru berfungsi
- [ ] Login dengan credentials berfungsi
- [ ] Product list muncul
- [ ] Admin dashboard accessible (jika admin)
- [ ] No CORS errors di browser console
- [ ] No 404 on API routes
- [ ] No 502 Bad Gateway errors

---

## 🆘 Still Having Issues?

### 1. **Cek Vercel Function Logs**

```
Dashboard → Deployments → Functions → View Logs
```

### 2. **Test API Locally First**

```powershell
# Di local, test serverless function
cd api
node -e "const app = require('./index.js'); const server = app.listen(3000, () => console.log('Test on 3000')); setTimeout(() => server.close(), 5000)"
```

### 3. **Simplify untuk Debug**

Buat test endpoint minimal:

```javascript
// api/test.js
module.exports = (req, res) => {
  res.json({ ok: true, message: "Test works!" });
};
```

Deploy dan test:

```powershell
curl https://your-app.vercel.app/api/test
```

### 4. **Check Package Versions**

Pastikan versions compatible dengan Vercel:

- Node.js: 18.x atau 20.x
- Express: 4.x
- Supabase client: 2.x

---

## 📝 Next Steps

1. ✅ Push changes ke GitHub
2. ✅ Vercel auto-deploy
3. ✅ Set environment variables
4. ✅ Test `/api/health`
5. ✅ Test frontend login
6. ✅ Monitor logs untuk errors
7. ✅ Update CORS_ORIGIN jika perlu

---

**Deployment should work now! 🚀**

Jika masih ada masalah, share:

1. URL Vercel deployment Anda
2. Screenshot error dari browser console
3. Logs dari Vercel Functions
