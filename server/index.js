/* eslint-env node */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const ordersRouter = require('./routes/orders');
const reviewsRouter = require('./routes/reviews');
const uploadsRouter = require('./routes/uploads');
const telegramRouter = require('./routes/telegram');
const telegramResellerRouter = require('./routes/telegramReseller');
const telegramRegistrationRouter = require('./routes/telegramRegistration');
const notificationsRouter = require('./routes/notifications');
const resellerRouter = require('./routes/reseller');
const TelegramPolling = require('./services/telegramPolling');
const ResellerTelegramPolling = require('./services/resellerTelegramPolling');
const NotificationService = require('./services/notificationService');

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

// Store database connection in app.locals for routes to access
app.locals.db = pool;

// Initialize notification service
const notificationService = new NotificationService(pool);
app.locals.notificationService = notificationService;

app.get('/', (req, res) => res.json({ ok: true, message: 'Billsnack API running' }));

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/resellers', resellerRouter);
// serve uploaded files statically
app.use('/uploads', express.static(require('path').join(__dirname, 'public', 'uploads')));
app.use('/api/uploads', uploadsRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/telegram', telegramResellerRouter);
app.use('/api/telegram', telegramRegistrationRouter);

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

  // Initialize Telegram polling for development/localhost
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (telegramBotToken) {
    const telegramPolling = new TelegramPolling(pool, telegramBotToken);
    telegramPolling.startPolling();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down gracefully...');
      telegramPolling.stopPolling();
      process.exit(0);
    });
  } else {
    console.warn('TELEGRAM_BOT_TOKEN not set, Telegram bot polling disabled');
  }

  // Initialize Reseller Telegram polling for development/localhost
  const telegramResellerBotToken = process.env.TELEGRAM_RESELLER_BOT_TOKEN;
  if (telegramResellerBotToken) {
    const resellerTelegramPolling = new ResellerTelegramPolling(pool);
    resellerTelegramPolling.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down Reseller bot gracefully...');
      resellerTelegramPolling.stop();
      process.exit(0);
    });
  } else {
    console.warn('TELEGRAM_RESELLER_BOT_TOKEN not set, Reseller Telegram bot polling disabled');
  }

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
