/* eslint-env node */
const express = require('express');
const pool = require('../db');
const auth = require('./auth');

const router = express.Router();
const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

function requireReseller(req, res, next) {
  const u = req.user || {};
  if (u.role && u.role === 'reseller') return next();
  return res.status(403).json({ error: 'Reseller privileges required' });
}

// List resellers (non-sensitive fields). Optional ?excludeSelf=1 to hide current user
router.get('/', verifyToken, async (req, res) => {
  const excludeSelf = req.query.excludeSelf === '1';
  const userId = req.user && req.user.id;
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.username, rp.store_name, rp.phone
       FROM users u
       LEFT JOIN reseller_profiles rp ON rp.user_id = u.id
       WHERE u.role = 'reseller'`);
    const out = rows.filter(r => !(excludeSelf && userId && r.id === userId));
    res.json(out);
  } catch (err) {
    console.error('Failed to fetch resellers', err);
    res.status(500).json({ error: 'Failed to fetch resellers' });
  }
});

// Return the list of connected reseller IDs for the authenticated user
router.get('/connections', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [rows] = await pool.execute(
      `SELECT user_a, user_b, status FROM reseller_connections WHERE user_a = ? OR user_b = ?`,
      [userId, userId]
    );
    // map to set of peer ids
    const peers = new Set();
    rows.forEach(r => {
      if (r.user_a === userId) peers.add(r.user_b);
      if (r.user_b === userId) peers.add(r.user_a);
    });
    res.json({ connections: Array.from(peers) });
  } catch (err) {
    console.error('Failed to fetch connections', err);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// Toggle connection: create symmetric rows when connecting, remove both when disconnecting
router.post('/:id/connect', verifyToken, requireReseller, async (req, res) => {
  const targetId = Number(req.params.id);
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!targetId || userId === targetId) return res.status(400).json({ error: 'Invalid target' });
  try {
    // check existing connection
    const [existing] = await pool.execute(
      'SELECT id FROM reseller_connections WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)',
      [userId, targetId, targetId, userId]
    );
    if (existing && existing.length > 0) {
      // disconnect: remove both directional rows
      await pool.execute('DELETE FROM reseller_connections WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)', [userId, targetId, targetId, userId]);
      return res.json({ ok: true, connected: false });
    }

    // create symmetric rows (ignore duplicate errors)
    await pool.execute('INSERT IGNORE INTO reseller_connections (user_a, user_b, status) VALUES (?, ?, ?)', [userId, targetId, 'connected']);
    await pool.execute('INSERT IGNORE INTO reseller_connections (user_a, user_b, status) VALUES (?, ?, ?)', [targetId, userId, 'connected']);
    return res.json({ ok: true, connected: true });
  } catch (err) {
    console.error('Failed to toggle connection', err);
    res.status(500).json({ error: 'Failed to toggle connection' });
  }
});

// Get reseller statistics (products sold and total earnings)
router.get('/stats', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    // Calculate total products sold and earnings from order_items
    const [orderStats] = await pool.execute(
      `SELECT 
        COALESCE(SUM(oi.quantity), 0) as totalSold,
        COALESCE(SUM(oi.total_price), 0) as totalEarnings
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE p.reseller_id = ? 
       AND o.status IN ('Sedang Dikirim', 'Selesai')`,
      [userId]
    );

    const stats = {
      totalSold: orderStats[0]?.totalSold || 0,
      totalEarnings: parseFloat(orderStats[0]?.totalEarnings || 0)
    };

    res.json(stats);
  } catch (err) {
    console.error('Failed to fetch reseller stats', err);
    res.status(500).json({ error: 'Failed to fetch reseller stats' });
  }
});

// Get list of sold products with details
router.get('/sold-products', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const [soldProducts] = await pool.execute(
      `SELECT 
        p.id,
        p.name,
        p.price,
        SUM(oi.quantity) as totalQuantitySold,
        SUM(oi.total_price) as totalRevenue,
        COUNT(DISTINCT oi.order_id) as orderCount
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE p.reseller_id = ? 
       AND o.status IN ('Sedang Dikirim', 'Selesai')
       GROUP BY p.id, p.name, p.price
       ORDER BY totalQuantitySold DESC`,
      [userId]
    );

    const formatted = soldProducts.map(item => ({
      ...item,
      totalRevenue: parseFloat(item.totalRevenue || 0),
      price: parseFloat(item.price || 0)
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch sold products', err);
    res.status(500).json({ error: 'Failed to fetch sold products' });
  }
});

module.exports = router;
