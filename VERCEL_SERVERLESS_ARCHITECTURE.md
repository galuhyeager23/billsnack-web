# Arsitektur Vercel Serverless untuk Billsnack

## 📖 Penjelasan Perubahan

### Sebelum (Traditional Server)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│   Express   │ ← Running 24/7 di server
│   Server    │ ← Port 4000
│  (Node.js)  │ ← Consumes resources terus-menerus
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│ (Database)  │
└─────────────┘
```

### Setelah (Vercel Serverless)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────┐
│     Vercel Edge Network     │ ← CDN Global
│  (Serves static files)      │ ← React app dari /dist
└──────┬──────────────────────┘
       │ /api/* requests
       ▼
┌─────────────────────────────┐
│  Vercel Serverless Function │ ← Only runs when called
│    (api/index.js)           │ ← Auto-scales
│    Express app as handler   │ ← Cold start ~50-200ms
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│ (Database)  │
└─────────────┘
```

## 🔄 Perubahan yang Dilakukan

### 1. Struktur File Baru

```
billsnack-web/
├── api/                    # ✨ BARU - Vercel Functions
│   ├── index.js           # Main API handler (wraps Express)
│   └── uploads.js         # File serving handler
├── server/                # Original Express app (unchanged)
│   ├── routes/
│   ├── services/
│   └── ...
├── vercel.json            # ✨ BARU - Vercel config
├── .vercelignore          # ✨ BARU - Exclude files
└── .env.example           # ✨ BARU - All env vars
```

### 2. `vercel.json` Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/uploads/(.*)", "dest": "/api/uploads.js" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**Penjelasan:**

- `builds`: Build React app dengan Vite → output `dist/`
- `routes`: Routing rules
  - `/api/*` → serverless function `api/index.js`
  - `/uploads/*` → serverless function `api/uploads.js`
  - `filesystem` → serve static files dari `dist/`
  - `/*` → fallback ke `index.html` (SPA routing)

### 3. `api/index.js` - Serverless Function

File ini adalah **wrapper** untuk Express app yang sudah ada:

```javascript
// Import semua routes yang sudah ada
const express = require("express");
const productsRouter = require("../server/routes/products");
// ... import semua routes lainnya

const app = express();

// Setup middleware
app.use(cors());
app.use(express.json());

// Setup Supabase
const supabase = createClient(/* ... */);
app.locals.supabase = supabase;

// Mount all routes
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
// ... mount semua routes lainnya

// Export as serverless function
module.exports = app;
```

**Penting:** Tidak ada `app.listen()` karena Vercel yang handle HTTP server.

### 4. Package.json Updates

Semua dependencies dari `server/package.json` dipindah ke root `package.json`:

```json
{
  "dependencies": {
    // Frontend deps
    "react": "^19.1.1",
    // Backend deps
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.21.2",
    "cors": "^2.8.5"
    // ... semua deps lainnya
  },
  "scripts": {
    "vercel-build": "vite build"
  }
}
```

**Kenapa?** Vercel install dependencies dari root `package.json` saja.

## ⚡ Keuntungan Serverless

### 1. **Zero Maintenance**

- Tidak perlu manage server
- Auto-scaling otomatis
- No downtime deployments

### 2. **Cost Effective**

- Free tier Vercel: 100 GB bandwidth/bulan
- Only pay for execution time (hobby tier: FREE)
- Tidak bayar untuk idle time

### 3. **Global Performance**

- Edge network CDN
- Static files served dari lokasi terdekat user
- Serverless functions di multiple regions

### 4. **Easy Deployment**

- Git push → Auto deploy
- Preview deployments untuk setiap PR
- Rollback instant

## ⚠️ Limitasi & Workarounds

### 1. Telegram Bot Polling ❌

**Problem:**

```javascript
// Ini TIDAK BISA di serverless (butuh long-running process)
bot.startPolling();
```

**Solusi:**

1. **Webhooks** (recommended)

   - Setup webhook di Telegram
   - Telegram send requests ke `/api/telegram-webhook`
   - No polling needed

2. **Deploy Bot Terpisah**
   - Railway/Render untuk bot polling
   - Vercel untuk web app & API

### 2. File Uploads 💾

**Problem:**

- Filesystem di serverless adalah read-only & temporary
- Files hilang setelah function execution selesai

**Solusi:**

1. **Supabase Storage** (recommended)

   ```javascript
   const { data, error } = await supabase.storage
     .from("product-images")
     .upload("path/to/file", file);
   ```

2. **Vercel Blob**
   ```javascript
   import { put } from "@vercel/blob";
   const { url } = await put("filename.jpg", file, {
     access: "public",
   });
   ```

### 3. Cold Starts 🧊

**Problem:**

- First request setelah idle: ~50-200ms delay
- Function harus di-initialize ulang

**Mitigasi:**

- Vercel keep functions warm untuk free (limited)
- Optimize function size
- Use Edge Functions untuk critical paths

### 4. Timeout Limits ⏱️

**Limits:**

- Hobby (Free): 10 seconds
- Pro: 60 seconds

**Mitigasi:**

- Long-running tasks → background job services
- Optimize database queries
- Use caching

## 🔧 Environment Variables

### Development (.env local)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-key
JWT_SECRET=dev-secret
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Production (Vercel Dashboard)

Set di: Project Settings → Environment Variables

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-production-key
JWT_SECRET=super-strong-production-secret
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
ADMIN_EMAIL=admin@yourdomain.com
SALT_ROUNDS=10
```

**Penting:**

- Gunakan secrets yang berbeda untuk dev & prod
- JANGAN commit .env ke Git
- Rotate secrets secara berkala

## 🚀 Deployment Workflow

### 1. Development

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (traditional server)
cd server
npm start
```

### 2. Commit & Push

```bash
git add .
git commit -m "Feature: New awesome feature"
git push origin main
```

### 3. Auto Deploy

Vercel otomatis:

1. Detect push ke GitHub
2. Run `npm install`
3. Run `vite build` (dari `vercel-build` script)
4. Deploy static files ke CDN
5. Deploy serverless functions
6. Generate deployment URL
7. Update production (jika push ke main branch)

### 4. Rollback (if needed)

Vercel Dashboard → Deployments → Previous deployment → Promote to Production

## 📊 Monitoring

### Vercel Dashboard

1. **Functions**

   - Execution time
   - Error rate
   - Cold starts
   - Logs

2. **Analytics**

   - Page views
   - Web Vitals
   - Geography

3. **Deployments**
   - Build logs
   - Deploy history
   - Preview URLs

### Supabase Dashboard

1. **Database**

   - Query performance
   - Active connections
   - Storage usage

2. **Logs**
   - SQL queries
   - Errors
   - Authentication events

## 🎯 Best Practices

### 1. Optimize Bundle Size

```javascript
// Import hanya yang dibutuhkan
import { createClient } from "@supabase/supabase-js";

// Bukan
import * as Supabase from "@supabase/supabase-js";
```

### 2. Use Connection Pooling

Supabase sudah handle ini, tapi pastikan:

- Set `persistSession: false` di Supabase client
- Use `autoRefreshToken: true`

### 3. Cache Static Assets

Vercel automatically cache:

- Static files (forever)
- API responses (configurable via headers)

### 4. Error Handling

```javascript
// Always handle errors properly
try {
  const { data, error } = await supabase.from("users").select();
  if (error) throw error;
  return data;
} catch (err) {
  console.error("Database error:", err);
  throw new Error("Failed to fetch users");
}
```

### 5. Security

```javascript
// Never expose sensitive data
app.get("/api/health", async (req, res) => {
  // ❌ BAD
  res.json({ supabaseKey: process.env.SUPABASE_KEY });

  // ✅ GOOD
  res.json({ status: "ok", database: "connected" });
});
```

## 📝 Checklist Migrasi

- [x] Create `vercel.json`
- [x] Create `api/index.js` wrapper
- [x] Create `api/uploads.js` handler
- [x] Merge dependencies ke root `package.json`
- [x] Add `vercel-build` script
- [x] Create `.env.example`
- [x] Update `.gitignore`
- [x] Create `.vercelignore`
- [x] Update README.md
- [x] Create VERCEL_DEPLOYMENT.md

## 🆘 Troubleshooting

### Build Error: "Module not found"

**Penyebab:** Dependencies tidak ada di root `package.json`

**Fix:**

```bash
npm install <missing-package>
```

### Runtime Error: "Cannot find module '../server/...'"

**Penyebab:** Path relative salah di serverless environment

**Fix:** Cek path di `api/index.js` harus sesuai dengan struktur folder

### Error: "Function execution timed out"

**Penyebab:** Request > 10 seconds (free tier)

**Fix:**

- Optimize database queries
- Add indexes di Supabase
- Cache results
- Upgrade ke Pro plan ($20/month → 60s timeout)

### CORS Error di Production

**Penyebab:** `CORS_ORIGIN` tidak sesuai dengan domain Vercel

**Fix:**

1. Cek URL deployment Vercel
2. Update environment variable `CORS_ORIGIN`
3. Redeploy

---

**Summary:** Project sekarang ready untuk Vercel deployment dengan Supabase tetap berfungsi normal! 🎉
