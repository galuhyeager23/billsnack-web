/* eslint-env node */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const uploadsRouter = require('./routes/uploads');

const app = express();
// allow larger JSON payloads because registration may include base64 image data URLs
app.use(express.json({ limit: '10mb' }));
// also accept urlencoded bodies for form submissions if needed
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS: in development allow local frontend origins; in production use CORS_ORIGIN env
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  const allowedOrigin = process.env.CORS_ORIGIN || '';
  app.use(cors({ origin: allowedOrigin, credentials: true }));
} else {
  // during development be permissive for localhost variants
  app.use(cors({ origin: (origin, cb) => {
    // allow non-browser requests (e.g., curl) with no origin
    if (!origin) return cb(null, true);
    const allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000'
    ];
    if (allowed.includes(origin)) return cb(null, true);
    // reflect origin to allow e.g. different hosts during dev
    return cb(null, true);
  }, credentials: true }));
}

app.get('/', (req, res) => res.json({ ok: true, message: 'Billsnack API running' }));

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
// serve uploaded files statically
app.use('/uploads', express.static(require('path').join(__dirname, 'public', 'uploads')));
app.use('/api/uploads', uploadsRouter);

// health check route that verifies DB connection
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    console.error('DB health error', err);
    res.status(500).json({ ok: false, db: 'error', error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Quick DB health check on startup to help debugging login/db issues
  (async () => {
    try {
      // show effective DB connection config (mask password)
      const host = process.env.DB_HOST || '127.0.0.1';
      const port = process.env.DB_PORT || 3306;
      const user = process.env.DB_USER || 'billsnack';
      const db = process.env.DB_DATABASE || 'billsnack';
      console.log(`Attempting DB connection to ${user}@${host}:${port}/${db} ...`);
      await pool.query('SELECT 1');
      console.log('DB connection OK');
    } catch (err) {
      console.error('DB connection failed on startup — login will fail until DB is reachable.');
      console.error(err && err.message ? err.message : err);
    }
  })();
});
