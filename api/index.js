const express = require('express');
const cors = require('cors');
const supabase = require('../server/supabase');
const productsRouter = require('../server/routes/products');
const authRouter = require('../server/routes/auth');
const adminRouter = require('../server/routes/admin');
const ordersRouter = require('../server/routes/orders');
const reviewsRouter = require('../server/routes/reviews');
const uploadsRouter = require('../server/routes/uploads');
const telegramRouter = require('../server/routes/telegram');
const telegramResellerRouter = require('../server/routes/telegramReseller');
const telegramRegistrationRouter = require('../server/routes/telegramRegistration');
const notificationsRouter = require('../server/routes/notifications');
const resellerRouter = require('../server/routes/reseller');
const shippingRouter = require('../server/routes/shipping');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration for Vercel
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://billsnack-web.vercel.app',
  'https://billsnack-web-galuhyeager23.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development
    }
  },
  credentials: true
}));

// Store Supabase client in app.locals
app.locals.supabase = supabase;

// Routes
app.use('/products', productsRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/orders', ordersRouter);
app.use('/reviews', reviewsRouter);
app.use('/uploads', uploadsRouter);
app.use('/telegram', telegramRouter);
app.use('/telegram-reseller', telegramResellerRouter);
app.use('/telegram-registration', telegramRegistrationRouter);
app.use('/notifications', notificationsRouter);
app.use('/reseller', resellerRouter);
app.use('/shipping', shippingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Export for Vercel
module.exports = app;