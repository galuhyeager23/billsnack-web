/* eslint-env node */
const express = require('express');
const pool = require('../db');
const auth = require('./auth');

const router = express.Router();
const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at, u.email, u.username, u.first_name, u.last_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? ORDER BY r.created_at DESC`,
      [productId]
    );
    const out = rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      rating: Number(r.rating),
      comment: r.comment,
      createdAt: r.created_at,
      // prefer first/last name, then username, then email
      user_name: (r.first_name || r.last_name) ? `${r.first_name || ''} ${r.last_name || ''}`.trim() : (r.username || r.email),
    }));
    res.json(out);
  } catch (err) {
    console.error('Get reviews error', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Check if authenticated user can review a product (must have purchased)
router.get('/can-review', verifyToken, async (req, res) => {
  const productId = req.query.productId;
  const userId = req.user && req.user.id;
  const userEmail = req.user && req.user.email;
  if (!productId || !userId) return res.json({ canReview: false });
  try {
    const [rows] = await pool.execute(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE (o.user_id = ? OR o.email = ?) AND oi.product_id = ? LIMIT 1`,
      [userId, userEmail || null, productId]
    );
    res.json({ canReview: rows.length > 0 });
  } catch (err) {
    console.error('can-review check error', err);
    res.status(500).json({ error: 'Failed to check purchase history' });
  }
});

// Post a review (authenticated, must have purchased)
router.post('/', verifyToken, async (req, res) => {
  const userId = req.user && req.user.id;
  const { productId, rating, comment } = req.body || {};
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!productId || typeof rating === 'undefined') return res.status(400).json({ error: 'Missing productId or rating' });

  try {
    // verify purchase (allow match by user_id or by order email matching user's email)
    const userEmail = req.user && req.user.email;
    const [pRows] = await pool.execute(
      `SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE (o.user_id = ? OR o.email = ?) AND oi.product_id = ? LIMIT 1`,
      [userId, userEmail || null, productId]
    );
    if (pRows.length === 0) return res.status(403).json({ error: 'User has not purchased this product' });

    // insert review
    const [r] = await pool.execute(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [productId, userId, rating, comment || null]
    );

    // recompute aggregate rating and count
    const [[agg]] = await pool.query(
      'SELECT COUNT(*) AS cnt, COALESCE(AVG(rating),0) AS avg_rating FROM reviews WHERE product_id = ?',
      [productId]
    );
    const cnt = agg.cnt || 0;
    const avg = Number(agg.avg_rating || 0).toFixed(2);
    await pool.execute('UPDATE products SET rating = ?, review_count = ? WHERE id = ?', [avg, cnt, productId]);

    res.status(201).json({ ok: true, reviewId: r.insertId, rating: Number(avg), reviewCount: cnt });
  } catch (err) {
    console.error('Post review error', err);
    res.status(500).json({ error: 'Failed to post review' });
  }
});

module.exports = router;
