# 📦 File Upload ke GitHub untuk Vercel Deployment

Sebelum deploy ke Vercel, pastikan file-file ini sudah di-commit dan push ke GitHub.

## ✅ Checklist File Yang Harus Ada

### Root Directory

- [x] `vercel.json` - Konfigurasi Vercel
- [x] `.vercelignore` - File yang di-exclude dari deployment
- [x] `.env.example` - Template environment variables
- [x] `.gitignore` - Updated untuk exclude .env dan .vercel
- [x] `package.json` - Updated dengan dependencies backend
- [x] `VERCEL_DEPLOYMENT.md` - Panduan deployment lengkap
- [x] `VERCEL_SERVERLESS_ARCHITECTURE.md` - Penjelasan arsitektur
- [x] `README.md` - Updated dengan info deployment

### api/ Directory (BARU)

- [x] `api/index.js` - Main serverless function handler
- [x] `api/uploads.js` - File upload handler

### server/ Directory (Tetap Ada)

- [x] `server/routes/*` - Semua route files
- [x] `server/services/*` - Semua service files
- [x] `server/supabase.js` - Supabase client
- [x] `server/.env.example` - Contoh environment variables

### src/ Directory (Frontend - Tetap Ada)

- [x] `src/config/api.js` - API configuration
- [x] Semua file React components

## 🚫 File Yang TIDAK Boleh Di-commit

```
.env                          # ❌ JANGAN commit!
.env.local                    # ❌ JANGAN commit!
.env.production               # ❌ JANGAN commit!
server/.env                   # ❌ JANGAN commit!
.vercel/                      # ❌ Auto-generated
node_modules/                 # ❌ Dependencies
dist/                         # ❌ Build output
server/public/uploads/*       # ❌ User uploads (use Supabase Storage)
```

## 📝 Git Commands

### 1. Cek Status

```bash
git status
```

Pastikan tidak ada file sensitif (.env) yang akan di-commit.

### 2. Add Files

```bash
# Add all new files
git add .

# Atau add specific files
git add vercel.json
git add api/
git add .env.example
git add VERCEL_DEPLOYMENT.md
git add VERCEL_SERVERLESS_ARCHITECTURE.md
```

### 3. Commit

```bash
git commit -m "Setup Vercel deployment with serverless functions

- Add vercel.json configuration
- Create api/index.js serverless handler
- Create api/uploads.js for file serving
- Merge server dependencies to root package.json
- Add comprehensive deployment documentation
- Update .gitignore and create .vercelignore
- Add environment variables template"
```

### 4. Push to GitHub

```bash
git push origin main
```

## 🔒 Security Check

Sebelum push, pastikan:

```bash
# Cek tidak ada .env yang akan di-commit
git status | grep ".env"

# Output harus kosong atau hanya .env.example
```

Jika ada .env yang muncul:

```bash
# Remove from staging
git reset HEAD .env
git reset HEAD server/.env
```

## 🌐 Setelah Push ke GitHub

1. **Login ke Vercel**

   - https://vercel.com

2. **Import Project**

   - Add New Project
   - Import dari GitHub
   - Pilih repository `billsnack-web`

3. **Configure Environment Variables**

   - Copy dari `.env.example`
   - Set di Vercel Dashboard

4. **Deploy!**
   - Vercel akan auto-detect Vite project
   - Build command: `npm run build`
   - Output directory: `dist`

## 📊 File Structure Setelah Setup

```
billsnack-web/
├── .git/
├── .gitignore              ✅ Updated
├── .vercelignore           ✅ NEW
├── .env.example            ✅ NEW
├── vercel.json             ✅ NEW
├── package.json            ✅ Updated (includes server deps)
├── README.md               ✅ Updated
├── VERCEL_DEPLOYMENT.md    ✅ NEW - Panduan deployment
├── VERCEL_SERVERLESS_ARCHITECTURE.md  ✅ NEW - Arsitektur
│
├── api/                    ✅ NEW - Vercel Functions
│   ├── index.js           ✅ Main API handler
│   └── uploads.js         ✅ File serving
│
├── server/                ✅ Existing - Backend code
│   ├── routes/
│   ├── services/
│   ├── supabase.js
│   └── package.json       (Not used in Vercel)
│
├── src/                   ✅ Existing - React frontend
│   ├── components/
│   ├── config/
│   └── ...
│
└── dist/                  ❌ Excluded (build output)
```

## 🎯 Quick Deploy Commands

```bash
# 1. Check current status
git status

# 2. Add all new files
git add .

# 3. Commit with descriptive message
git commit -m "Setup Vercel deployment configuration"

# 4. Push to GitHub
git push origin main

# 5. Go to Vercel
# https://vercel.com/new
# Import your GitHub repo
# Add environment variables
# Deploy!
```

## 🔄 Auto Deployment

Setelah initial setup, setiap push ke GitHub akan otomatis deploy:

```bash
# Make changes to code
# ...

# Commit and push
git add .
git commit -m "Update: New feature"
git push origin main

# Vercel automatically:
# ✅ Detects push
# ✅ Runs build
# ✅ Deploys to production
# ✅ Sends notification
```

## 🌟 Environment Variables untuk Vercel

Copy nilai-nilai ini ke Vercel Dashboard → Project Settings → Environment Variables:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-strong-random-secret
ADMIN_EMAIL=admin@yourdomain.com
CORS_ORIGIN=https://your-app.vercel.app
NODE_ENV=production
SALT_ROUNDS=10

# Optional (Telegram)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-chat-id
TELEGRAM_RESELLER_BOT_TOKEN=your-reseller-bot-token
```

## ✅ Verification

Setelah deploy, test:

1. **Health Check**

   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Frontend**

   - Buka https://your-app.vercel.app
   - Pastikan halaman utama muncul

3. **Login**
   - Test login dengan admin credentials
   - Pastikan authentication berfungsi

## 🆘 Troubleshooting

### "Module not found" saat build

**Fix:**

```bash
# Pastikan dependencies ada di root package.json
npm install <missing-package>
git add package.json
git commit -m "Add missing dependency"
git push
```

### Build success tapi 404 di /api routes

**Fix:**

- Cek `vercel.json` ada di root
- Redeploy dari Vercel Dashboard

### CORS error

**Fix:**

- Update `CORS_ORIGIN` di Vercel environment variables
- Redeploy

---

**Ready to deploy! 🚀**

Ikuti checklist di atas, push ke GitHub, dan deploy di Vercel!
