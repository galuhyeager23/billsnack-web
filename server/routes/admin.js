/* eslint-env node */
const express = require('express');
const pool = require('../db');
const auth = require('./auth');

const router = express.Router();

// reuse verifyToken exported from auth router
const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

// admin-role check middleware
function requireAdmin(req, res, next) {
  const user = req.user || {};
  if (user.role && user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin privileges required' });
}

// All admin routes should use verifyToken + requireAdmin
// Products (admin CRUD)
router.get('/products', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM products ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Admin get products error', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/products', verifyToken, requireAdmin, async (req, res) => {
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput } = req.body;
  if (!name || typeof price === 'undefined') return res.status(400).json({ error: 'Missing required fields' });
  // accept either camelCase `inStock` or snake_case `in_stock` and sanitize
  const { sanitizeInStock } = require('../utils/validate');
  const inStockInput = typeof req.body.inStock !== 'undefined' ? req.body.inStock : req.body.in_stock;
  let in_stock = sanitizeInStock(inStockInput);
  if (in_stock === null) in_stock = Number(stock) > 0 ? 1 : 0;
  try {
    // stringify arrays for JSON/DB storage
    const imagesJson = imagesInput && Array.isArray(imagesInput) ? JSON.stringify(imagesInput) : null;
    const colorsJson = colorsInput && Array.isArray(colorsInput) ? JSON.stringify(colorsInput) : null;
    const [result] = await pool.execute(
      'INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock]
    );
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    const r = rows[0];
    const images = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
    const colors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
    const out = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: Number(r.stock),
      inStock: !!Number(r.in_stock),
      category: r.category,
      images,
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors,
      createdAt: r.created_at,
    };
    res.status(201).json(out);
  } catch (err) {
    console.error('Admin create product error', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput } = req.body;
  // accept camelCase `inStock` or snake_case `in_stock`
  const inStockInput = typeof req.body.inStock !== 'undefined' ? req.body.inStock : req.body.in_stock;
  const in_stock = typeof inStockInput !== 'undefined' ? (inStockInput ? 1 : 0) : (Number(stock) > 0 ? 1 : 0);
  try {
    const imagesJson = imagesInput && Array.isArray(imagesInput) ? JSON.stringify(imagesInput) : null;
    const colorsJson = colorsInput && Array.isArray(colorsInput) ? JSON.stringify(colorsInput) : null;
    const [result] = await pool.execute(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, images = ?, original_price = ?, rating = ?, review_count = ?, colors = ?, in_stock = ? WHERE id = ?',
      [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    const r = rows[0];
    const images = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
    const colors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
    const out = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: Number(r.stock),
      inStock: !!Number(r.in_stock),
      category: r.category,
      images,
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors,
      createdAt: r.created_at,
    };
    res.json(out);
  } catch (err) {
    console.error('Admin update product error', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete product error', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Users: list users (non-sensitive fields)
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, username, phone, gender, role, created_at FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin get users error', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: set or update a user's role (e.g., mark as 'reseller')
router.put('/users/:id/role', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  if (!role) return res.status(400).json({ error: 'Missing role in body' });
  const allowed = ['user', 'reseller', 'admin'];
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const [result] = await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    const [rows] = await pool.execute('SELECT id, email, first_name, last_name, username, phone, gender, role, created_at FROM users WHERE id = ?', [id]);
    return res.json({ ok: true, user: rows[0] });
  } catch (err) {
    console.error('Admin update user role error', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Transactions: best-effort read (returns [] if no table exists)
router.get('/transactions', verifyToken, requireAdmin, async (req, res) => {
  try {
    // try common table names used by the app (orders/transactions)
    const tryTables = ['transactions', 'orders', 'order_items'];
    for (const t of tryTables) {
      try {
        // Enrich known tables with related user/order info so admin UI can show customer
        let rows = [];
        if (t === 'orders') {
          // compute amount from order_items.total_price when possible so the admin UI
          // shows the sum of product prices the customer actually ordered. Fall back
          // to o.total when no items present.
          const r = await pool.execute(
            `SELECT o.*, o.id AS order_id, o.order_number AS order_number,
                    COALESCE(o.payment_method, JSON_UNQUOTE(JSON_EXTRACT(o.metadata, '$.payment'))) AS payment_method,
                    u.email AS user_email, u.role AS user_role, u.first_name, u.last_name,
                    COALESCE(o.total, SUM(oi.total_price)) AS amount
             FROM \`orders\` o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN users u ON o.user_id = u.id
             GROUP BY o.id
             ORDER BY o.id DESC LIMIT 500`
          );
          rows = r[0];
        } else if (t === 'transactions') {
          // Return a consistent `amount` for transactions by falling back to
          // transaction amount, then linked order.total, then sum of order_items
          // so admin UI shows the real billed amount.
          const r = await pool.execute(
      `SELECT tr.*, o.id AS order_id, o.order_number AS order_number, o.total AS order_total,
        COALESCE(tr.amount, o.total, SUM(oi.total_price)) AS amount,
        COALESCE(o.payment_method, JSON_UNQUOTE(JSON_EXTRACT(o.metadata, '$.payment'))) AS payment_method,
        o.email AS order_email, o.name AS order_name, u.email AS user_email, u.role AS user_role, u.first_name, u.last_name
             FROM \`transactions\` tr
             LEFT JOIN orders o ON tr.order_id = o.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN users u ON o.user_id = u.id
             GROUP BY tr.id
             ORDER BY tr.id DESC LIMIT 500`
          );
          rows = r[0];
        } else {
          const r = await pool.execute(`SELECT * FROM \`${t}\` ORDER BY id DESC LIMIT 500`);
          rows = r[0];
        }

        // If the table exists but has no rows, continue to next candidate so admins see orders when
        // transactions is present but empty. Only return when we have actual rows.
        if (rows && rows.length > 0) {
          return res.json({ table: t, rows });
        }
        // otherwise fall through to try next table name
      } catch (err) {
        // table may not exist - continue to next
        if (err && err.code === 'ER_NO_SUCH_TABLE') continue;
        // unexpected error - throw
        throw err;
      }
    }
    // no known transactions table present
    return res.json({ table: null, rows: [] });
  } catch (err) {
    console.error('Admin get transactions error', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;

// Admin: delete a user
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete user', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin-only: update a transaction's status when it is stored in `transactions` table
router.put('/transactions/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['Selesai', 'Menunggu', 'Gagal', 'Dikirim', 'Dalam Pengiriman'];
  if (!status || !allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const [result] = await pool.execute('UPDATE transactions SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Transaction not found' });
    const [rows] = await pool.execute('SELECT id, status FROM transactions WHERE id = ?', [id]);
    return res.json({ ok: true, transaction: rows[0] });
  } catch (err) {
    console.error('Failed to update transaction status', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});
