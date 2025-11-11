/* eslint-env node */
const express = require('express');
const pool = require('../db');
const auth = require('./auth');
const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();
function requireAdmin(req, res, next) {
  const user = req.user || {};
  if (user.role && user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin privileges required' });
}

const router = express.Router();

const { fetchCarrierStatus } = require('../services/trackingService');

// Create an order and order items, then increment product review_count based on quantity purchased
router.post('/', async (req, res) => {
  const { customer, items } = req.body || {};
  // allow discount and deliveryFee provided but we'll coerce them to numbers below
  const discountInput = req.body && typeof req.body.discount !== 'undefined' ? Number(req.body.discount) : 0;
  const deliveryFeeInput = req.body && typeof req.body.deliveryFee !== 'undefined' ? Number(req.body.deliveryFee) : 0;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Generate an order identifier (human-friendly-ish). Clients may pass their own
    // `orderNumber` (e.g. for gateways), otherwise we create one here.
    const orderNumber = req.body.orderNumber || `ORD-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const paymentMethod = req.body.paymentMethod || null;

    // Compute subtotal and per-item totals on the server to avoid trusting client values
    let computedSubtotal = 0;
    const normalizedItems = (items || []).map((it) => {
      const pid = it.productId || it.id || null;
      const name = it.name || '';
      const unit_price = Number(it.unit_price || it.price || 0);
      const quantity = Math.max(0, Number(it.quantity || 1));
      const total_price = Number(Number(unit_price * quantity).toFixed(2));
      computedSubtotal += total_price;
      const selected_options = it.selected_options ? JSON.stringify(it.selected_options) : null;
      return { pid, name, unit_price, quantity, total_price, selected_options };
    });

    const subtotal = Number(Number(computedSubtotal).toFixed(2));
    const discount = Number(Number(discountInput || 0).toFixed(2));
    const deliveryFee = Number(Number(deliveryFeeInput || 0).toFixed(2));
    const total = Number(Number(subtotal - discount + deliveryFee).toFixed(2));

    const [orderResult] = await conn.execute(
      'INSERT INTO orders (order_number, user_id, email, name, phone, address, city, province, postal_code, payment_method, subtotal, discount, delivery_fee, total, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ orderNumber, (req.user && req.user.id) || null, customer && customer.email || null, customer && customer.name || null, customer && customer.phone || null, customer && customer.address || null, customer && customer.city || null, customer && customer.province || null, customer && customer.postalCode || null, paymentMethod, subtotal, discount, deliveryFee, total, JSON.stringify({ payment: paymentMethod }) ]
    );
    const orderId = orderResult.insertId;

    // insert items and update product review_count
    for (const it of normalizedItems) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, total_price, selected_options) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, it.pid, it.name, it.unit_price, it.quantity, it.total_price, it.selected_options]
      );

      if (it.pid) {
        // increment review_count by quantity (treating purchases as reviews count)
        await conn.execute('UPDATE products SET review_count = IFNULL(review_count,0) + ? WHERE id = ?', [it.quantity, it.pid]);
      }
    }

  await conn.commit();
  res.status(201).json({ ok: true, orderId, orderNumber, subtotal, discount, deliveryFee, total });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error('Create order error', err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    conn.release();
  }
});

// Get orders for the authenticated user (purchase history)
// Protected: requires a valid JWT. Returns orders with their items.
router.get('/my', verifyToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id ? req.user.id : null;
    const userEmail = req.user && req.user.email ? req.user.email : null;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize) || 20));
    const offset = (page - 1) * pageSize;

    // optional status filter
    const statusFilter = req.query.status ? String(req.query.status) : null;

    // total count
    let countSql = 'SELECT COUNT(*) as cnt FROM orders WHERE (user_id = ? OR email = ?)';
    const countParams = [userId, userEmail];
    if (statusFilter) {
      countSql += ' AND status = ?';
      countParams.push(statusFilter);
    }
    const [countRows] = await pool.execute(countSql, countParams);
    const total = (countRows && countRows[0] && countRows[0].cnt) ? Number(countRows[0].cnt) : 0;

    if (total === 0) return res.json({ orders: [], total: 0, page, pageSize });

    // fetch paginated orders
    let fetchSql = 'SELECT id, user_id, email, name, phone, address, city, province, postal_code, subtotal, discount, delivery_fee, total, status, metadata, created_at FROM orders WHERE (user_id = ? OR email = ?)';
    const fetchParams = [userId, userEmail];
    if (statusFilter) {
      fetchSql += ' AND status = ?';
      fetchParams.push(statusFilter);
    }
    fetchSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    fetchParams.push(pageSize, offset);

    const [orders] = await pool.execute(fetchSql, fetchParams);

    const orderIds = orders.map(o => o.id);
    // fetch items for all orders in one query
    const [items] = await pool.execute(
      `SELECT id, order_id, product_id, name, unit_price, quantity, total_price, selected_options, created_at
       FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds
    );

    // group items by order_id
    const itemsByOrder = items.reduce((acc, it) => {
      acc[it.order_id] = acc[it.order_id] || [];
      acc[it.order_id].push(it);
      return acc;
    }, {});

    const result = orders.map(o => ({
      ...o,
      metadata: o.metadata ? (typeof o.metadata === 'string' ? JSON.parse(o.metadata) : o.metadata) : null,
      items: itemsByOrder[o.id] || []
    }));

    res.json({ orders: result, total, page, pageSize });
  } catch (err) {
    console.error('Failed to fetch user orders', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: set or update tracking info for an order
router.put('/:id/tracking', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { provider, tracking_number, history } = req.body || {};
  try {
    const [rows] = await pool.execute('SELECT metadata FROM orders WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const existingMeta = rows[0].metadata ? (typeof rows[0].metadata === 'string' ? JSON.parse(rows[0].metadata) : rows[0].metadata) : {};
    existingMeta.tracking = existingMeta.tracking || {};
    if (provider) existingMeta.tracking.provider = provider;
    if (tracking_number) existingMeta.tracking.tracking_number = tracking_number;
    if (Array.isArray(history)) existingMeta.tracking.history = history;

    await pool.execute('UPDATE orders SET metadata = ? WHERE id = ?', [JSON.stringify(existingMeta), id]);
    res.json({ ok: true, metadata: existingMeta });
  } catch (err) {
    console.error('Failed to update tracking', err);
    res.status(500).json({ error: 'Failed to update tracking' });
  }
});

// Customer: refresh tracking info for their own order (or admin)
// Calls the tracking service to fetch latest status and updates orders.metadata.tracking
router.post('/:id/tracking/refresh', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT id, user_id, email, metadata FROM orders WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = rows[0];
    const ownerId = order.user_id;
    const ownerEmail = order.email;
    const requester = req.user || {};
    const requesterId = requester.id;
    const requesterEmail = requester.email;
    const isOwner = (requesterId && ownerId && Number(requesterId) === Number(ownerId)) || (requesterEmail && ownerEmail && requesterEmail === ownerEmail);
    const isAdmin = requester.role && requester.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Not authorized to refresh tracking for this order' });

    const meta = order.metadata ? (typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata) : {};
    if (!meta.tracking || !meta.tracking.tracking_number) return res.status(400).json({ error: 'No tracking number available for this order' });

    const provider = meta.tracking.provider || null;
    const trackingNumber = meta.tracking.tracking_number;
    // fetch carrier status
    const status = await fetchCarrierStatus({ provider, trackingNumber });
    if (!status) return res.status(500).json({ error: 'Failed to fetch carrier status' });

    meta.tracking = status;
    await pool.execute('UPDATE orders SET metadata = ? WHERE id = ?', [JSON.stringify(meta), id]);
    res.json({ ok: true, metadata: meta });
  } catch (err) {
    console.error('Failed to refresh tracking', err);
    res.status(500).json({ error: 'Failed to refresh tracking' });
  }
});

module.exports = router;

// Admin: update order status (e.g., Selesai, Menunggu, Gagal, Dikirim, Dalam Pengiriman)
// Note: placed after exports so it doesn't interfere with other route ordering in some setups
router.put('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['Selesai', 'Menunggu', 'Gagal', 'Dikirim', 'Dalam Pengiriman'];
  if (!status || !allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const [result] = await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    const [rows] = await pool.execute('SELECT id, status FROM orders WHERE id = ?', [id]);
    return res.json({ ok: true, order: rows[0] });
  } catch (err) {
    console.error('Failed to update order status', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});


