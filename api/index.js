/* eslint-env node */
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Import routes
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
const NotificationService = require('../server/services/notificationService');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration for Vercel
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://yourdomain.vercel.app']; // Replace with your actual Vercel domain

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // For development, allow all
    }
  },
  credentials: true
}));

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dndhahhsnrrwpebrzpxu.supabase.co',
  process.env.SUPABASE_KEY || 'sb_publishable_OYsR8Q1MK24OCGL95AwHsA_wmP-fFPA',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  }
);

// Store Supabase client in app.locals
app.locals.supabase = supabase;

// Initialize notification service
const notificationService = new NotificationService(supabase);
app.locals.notificationService = notificationService;

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Billsnack API running on Vercel with Supabase',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ 
      ok: true, 
      database: 'connected', 
      provider: 'supabase',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('DB health error', err);
    res.status(500).json({ 
      ok: false, 
      database: 'error', 
      error: err.message 
    });
  }
});

// Mount API routes
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/resellers', resellerRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/telegram', telegramResellerRouter);
app.use('/api/telegram', telegramRegistrationRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ok: false
  });
});

// Export for Vercel serverless function
// Vercel needs the app to handle requests
module.exports = app;
module.exports.default = app;
