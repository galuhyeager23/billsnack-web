/* eslint-env node */
const express = require('express');
const supabase = require('../supabase');
const auth = require('./auth');
const TelegramService = require('../services/telegramService');

const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

const telegramService = new TelegramService(
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.TELEGRAM_ADMIN_CHAT_ID
);

function requireAdmin(req, res, next) {
  const user = req.user || {};
  if (user.role && user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin privileges required' });
}

const router = express.Router();

const { fetchCarrierStatus } = require('../services/trackingService');

// Create an order and order items
router.post('/', async (req, res) => {
  const { customer, items, shippingMethod } = req.body || {};
  const discountInput = req.body && typeof req.body.discount !== 'undefined' ? Number(req.body.discount) : 0;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  try {
    // Generate order number
    const orderNumber = req.body.orderNumber || `ORD-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const paymentMethod = req.body.paymentMethod || null;

    // Compute subtotal
    let computedSubtotal = 0;
    const normalizedItems = (items || []).map((it) => {
      const pid = it.productId || it.id || null;
      const name = it.name || '';
      const unit_price = Number(it.unit_price || it.price || 0);
      const quantity = Math.max(0, Number(it.quantity || 1));
      const total_price = Number(Number(unit_price * quantity).toFixed(2));
      computedSubtotal += total_price;
      const selected_options = it.selected_options || null;
      return { pid, name, unit_price, quantity, total_price, selected_options };
    });

    const subtotal = Number(Number(computedSubtotal).toFixed(2));
    const discount = Number(Number(discountInput || 0).toFixed(2));

    // Distance-based shipping fee computation
    const { computeShippingFee } = require('../services/shippingService');
    let deliveryFee = 0;
    if (customer && customer.city && shippingMethod) {
      const shippingResult = computeShippingFee({ city: customer.city, postalCode: customer.postalCode, method: shippingMethod });
      if (!shippingResult.available) {
        return res.status(400).json({ error: 'Metode pengiriman tidak tersedia untuk lokasi ini' });
      }
      // Each order here represents a single seller/store so use feePerStore directly
      deliveryFee = shippingResult.fee;
    }
    deliveryFee = Number(Number(deliveryFee).toFixed(2));
    const total = Number(Number(subtotal - discount + deliveryFee).toFixed(2));

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: (req.user && req.user.id) || null,
        email: customer?.email || null,
        name: customer?.name || null,
        phone: customer?.phone || null,
        address: customer?.address || null,
        city: customer?.city || null,
        province: customer?.province || null,
        postal_code: customer?.postalCode || null,
        payment_method: paymentMethod,
        subtotal,
        discount,
        delivery_fee: deliveryFee,
        total,
        metadata: { payment: paymentMethod }
      })
      .select()
      .single();

    if (orderError) throw orderError;
    const orderId = orderData.id;

    // Insert items and update products
    for (const it of normalizedItems) {
      // Insert order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          product_id: it.pid,
          name: it.name,
          unit_price: it.unit_price,
          quantity: it.quantity,
          total_price: it.total_price,
          selected_options: it.selected_options
        });

      if (itemError) throw itemError;

      if (it.pid) {
        // Increment review_count
        const { data: product } = await supabase
          .from('products')
          .select('review_count, stock')
          .eq('id', it.pid)
          .single();

        if (product) {
          const newReviewCount = (product.review_count || 0) + it.quantity;
          const newStock = Math.max(0, (product.stock || 0) - it.quantity);
          const inStock = newStock > 0;

          await supabase
            .from('products')
            .update({
              review_count: newReviewCount,
              stock: newStock,
              in_stock: inStock
            })
            .eq('id', it.pid);
        }
      }
    }

    // Send Telegram notification
    const orderDataForTelegram = {
      id: orderId,
      order_number: orderNumber,
      name: customer?.name || 'Unknown',
      email: customer?.email || 'N/A',
      phone: customer?.phone || 'N/A',
      address: customer?.address || 'N/A',
      city: customer?.city || 'N/A',
      province: customer?.province || 'N/A',
      total,
      items: normalizedItems,
    };
    telegramService.notifyNewOrder(orderDataForTelegram).catch((err) => {
      console.error('Failed to send Telegram notification:', err);
    });

    res.status(201).json({ ok: true, orderId, orderNumber, subtotal, discount, deliveryFee, total, shippingMethod });
  } catch (err) {
    console.error('Create order error', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get orders for authenticated user
router.get('/my', verifyToken, async (req, res) => {
  try {
    const userId = req.user && req.user.id ? req.user.id : null;
    const userEmail = req.user && req.user.email ? req.user.email : null;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize) || 20));
    const offset = (page - 1) * pageSize;
    const statusFilter = req.query.status ? String(req.query.status) : null;

    // Count total
    let countQuery = supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},email.eq.${userEmail}`);

    if (statusFilter) {
      countQuery = countQuery.eq('status', statusFilter);
    }

    const { count: total, error: countError } = await countQuery;
    if (countError) throw countError;

    if (total === 0) return res.json({ orders: [], total: 0, page, pageSize });

    // Fetch orders
    let fetchQuery = supabase
      .from('orders')
      .select('*')
      .or(`user_id.eq.${userId},email.eq.${userEmail}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (statusFilter) {
      fetchQuery = fetchQuery.eq('status', statusFilter);
    }

    const { data: orders, error: fetchError } = await fetchQuery;
    if (fetchError) throw fetchError;

    const orderIds = (orders || []).map(o => o.id);
    
    // Fetch items for all orders
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    // Group items by order_id
    const itemsByOrder = (items || []).reduce((acc, it) => {
      acc[it.order_id] = acc[it.order_id] || [];
      acc[it.order_id].push(it);
      return acc;
    }, {});

    const result = (orders || []).map(o => ({
      ...o,
      items: itemsByOrder[o.id] || []
    }));

    res.json({ orders: result, total, page, pageSize });
  } catch (err) {
    console.error('Failed to fetch user orders', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: set or update tracking info
router.put('/:id/tracking', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { provider, tracking_number, history } = req.body || {};
  
  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('metadata')
      .eq('id', id)
      .single();

    if (fetchError || !order) return res.status(404).json({ error: 'Order not found' });

    const existingMeta = order.metadata || {};
    existingMeta.tracking = existingMeta.tracking || {};
    if (provider) existingMeta.tracking.provider = provider;
    if (tracking_number) existingMeta.tracking.tracking_number = tracking_number;
    if (Array.isArray(history)) existingMeta.tracking.history = history;

    const { error: updateError } = await supabase
      .from('orders')
      .update({ metadata: existingMeta })
      .eq('id', id);

    if (updateError) throw updateError;
    res.json({ ok: true, metadata: existingMeta });
  } catch (err) {
    console.error('Failed to update tracking', err);
    res.status(500).json({ error: 'Failed to update tracking' });
  }
});

// Customer: refresh tracking info
router.post('/:id/tracking/refresh', verifyToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, user_id, email, metadata')
      .eq('id', id)
      .single();

    if (fetchError || !order) return res.status(404).json({ error: 'Order not found' });

    const ownerId = order.user_id;
    const ownerEmail = order.email;
    const requester = req.user || {};
    const requesterId = requester.id;
    const requesterEmail = requester.email;
    const isOwner = (requesterId && ownerId && Number(requesterId) === Number(ownerId)) || (requesterEmail && ownerEmail && requesterEmail === ownerEmail);
    const isAdmin = requester.role && requester.role === 'admin';
    
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Not authorized to refresh tracking for this order' });

    const meta = order.metadata || {};
    if (!meta.tracking || !meta.tracking.tracking_number) return res.status(400).json({ error: 'No tracking number available for this order' });

    const provider = meta.tracking.provider || null;
    const trackingNumber = meta.tracking.tracking_number;
    
    const status = await fetchCarrierStatus({ provider, trackingNumber });
    if (!status) return res.status(500).json({ error: 'Failed to fetch carrier status' });

    meta.tracking = status;
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ metadata: meta })
      .eq('id', id);

    if (updateError) throw updateError;
    res.json({ ok: true, metadata: meta });
  } catch (err) {
    console.error('Failed to refresh tracking', err);
    res.status(500).json({ error: 'Failed to refresh tracking' });
  }
});

// Admin: update order status
router.put('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['Selesai', 'Menunggu', 'Gagal', 'Dikirim', 'Dalam Pengiriman'];
  if (!status || !allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  
  try {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (updateError) throw updateError;

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, name, total, status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Send Telegram notification
    telegramService.notifyOrderStatusUpdate(order, status).catch((err) => {
      console.error('Failed to send status update notification:', err);
    });

    return res.json({ ok: true, order });
  } catch (err) {
    console.error('Failed to update order status', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
