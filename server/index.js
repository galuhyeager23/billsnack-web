require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');

const app = express();
app.use(express.json());

// Allow frontend dev server to access API
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.get('/', (req, res) => res.json({ ok: true, message: 'Billsnack API running' }));

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);

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
});
