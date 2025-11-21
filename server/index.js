/* eslint-env node */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabase');
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
const shippingRouter = require('./routes/shipping');
const TelegramPolling = require('./services/telegramPolling');
const ResellerTelegramPolling = require('./services/resellerTelegramPolling');
const NotificationService = require('./services/notificationService');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  const allowedOrigin = process.env.CORS_ORIGIN || '';
  app.use(cors({ origin: allowedOrigin, credentials: true }));
} else {
  app.use(cors({ origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000'
    ];
    if (allowed.includes(origin)) return cb(null, true);
    return cb(null, true);
  }, credentials: true }));
}

// Store Supabase client in app.locals
app.locals.supabase = supabase;

// Initialize notification service with Supabase
const notificationService = new NotificationService(supabase);
app.locals.notificationService = notificationService;

app.get('/', (req, res) => res.json({ ok: true, message: 'Billsnack API running with Supabase' }));

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/resellers', resellerRouter);
app.use('/api/shipping', shippingRouter);
app.use('/uploads', express.static(require('path').join(__dirname, 'public', 'uploads')));
app.use('/api/uploads', uploadsRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/telegram', telegramResellerRouter);
app.use('/api/telegram', telegramRegistrationRouter);

// Health check
app.get('/health', async (req, res) => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ ok: true, database: 'connected', provider: 'supabase' });
  } catch (err) {
    console.error('DB health error', err);
    res.status(500).json({ ok: false, database: 'error', error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using Supabase at: ${process.env.SUPABASE_URL || 'default-url'}`);

  // Initialize Telegram polling
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (telegramBotToken) {
    const telegramPolling = new TelegramPolling(supabase, telegramBotToken);
    telegramPolling.startPolling();

    process.on('SIGINT', () => {
      console.log('\nShutting down gracefully...');
      telegramPolling.stopPolling();
      process.exit(0);
    });
  } else {
    console.warn('TELEGRAM_BOT_TOKEN not set, Telegram bot polling disabled');
  }

  // Initialize Reseller Telegram polling
  const telegramResellerBotToken = process.env.TELEGRAM_RESELLER_BOT_TOKEN;
  if (telegramResellerBotToken) {
    const resellerTelegramPolling = new ResellerTelegramPolling(supabase);
    resellerTelegramPolling.start();

    process.on('SIGINT', () => {
      console.log('\nShutting down Reseller bot gracefully...');
      resellerTelegramPolling.stop();
      process.exit(0);
    });
  } else {
    console.warn('TELEGRAM_RESELLER_BOT_TOKEN not set, Reseller Telegram bot polling disabled');
  }

  // Quick health check on startup
  (async () => {
    try {
      console.log('Testing Supabase connection...');
      const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      if (error) throw error;
      console.log('✓ Supabase connection OK');
    } catch (err) {
      console.error('✗ Supabase connection failed on startup');
      console.error(err && err.message ? err.message : err);
      console.error('Please check your SUPABASE_URL and SUPABASE_KEY in .env');
    }
  })();
});
