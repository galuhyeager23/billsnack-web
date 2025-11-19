/* eslint-env node */
const express = require('express');
const pool = require('../db');
const router = express.Router();
const { sanitizeImages, sanitizeColors } = require('../utils/validate');
const auth = require('./auth');

// helper to detect if the products table has `is_approved` column
let _hasIsApproved = null;
async function hasIsApprovedColumn() {
  if (_hasIsApproved !== null) return _hasIsApproved;
  try {
    const dbName = process.env.DB_DATABASE || 'billsnack';
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?',
      [dbName, 'products', 'is_approved']
    );
    const cnt = rows && rows[0] && (rows[0].cnt || rows[0]['COUNT(*)'] || 0);
    _hasIsApproved = Number(cnt) > 0;
  } catch (e) {
    console.warn('Could not determine presence of is_approved column, assuming false', e);
    _hasIsApproved = false;
  }
  return _hasIsApproved;
}

// protect write operations: require JWT and admin role
const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();
function requireAdmin(req, res, next) {
  const user = req.user || {};
  if (user.role && user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin privileges required' });
}

// Get all products
router.get('/', async (req, res) => {
  try {
    // Only include reseller products if they are approved. Public products (reseller_id IS NULL) are always included.
    const hasIs = await hasIsApprovedColumn();
    const baseSelect = `SELECT p.*, u.first_name, u.last_name, u.email AS reseller_email, rp.store_name
       FROM products p
       LEFT JOIN users u ON p.reseller_id = u.id
       LEFT JOIN reseller_profiles rp ON rp.user_id = u.id`;
    const where = hasIs ? ' WHERE (p.reseller_id IS NULL OR p.is_approved = 1)' : '';
    const sqlAll = `${baseSelect}${where} ORDER BY p.id DESC`;
    const [rows] = await pool.execute(sqlAll);
    // normalize DB row -> frontend shape (camelCase + parsed arrays)
    const parsed = rows.map((r) => {
      const rawImages = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
      const rawColors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
      const images = sanitizeImages(rawImages) || [];
      const colors = sanitizeColors(rawColors) || [];
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        stock: r.stock,
        category: r.category,
        images,
        originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
        rating: r.rating !== null ? Number(r.rating) : 0,
        reviewCount: r.review_count || 0,
        is_approved: hasIs ? Number(r.is_approved) === 1 : true,
        colors,
        sellerName: (r.store_name && r.store_name.trim()) || (`${r.first_name || ''} ${r.last_name || ''}`.trim()) || r.reseller_email || 'Admin',
        resellerId: r.reseller_id,
        createdAt: r.created_at,
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get top-selling products (aggregated from order_items)
router.get('/top-selling', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    // Only include approved reseller products in top-selling for public view
    const hasIsTop = await hasIsApprovedColumn();
    const whereClause = hasIsTop ? 'WHERE (p.reseller_id IS NULL OR p.is_approved = 1)' : '';
    const sqlTop = `
      SELECT p.*, COALESCE(SUM(oi.quantity), 0) AS sold_qty
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY sold_qty DESC
      LIMIT ?`;
    const [rows] = await pool.execute(sqlTop, [limit]);

    const parsed = rows.map((r) => {
      const rawImages = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
      const rawColors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
      const images = sanitizeImages(rawImages) || [];
      const colors = sanitizeColors(rawColors) || [];
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        stock: r.stock,
        category: r.category,
        images,
        originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
        rating: r.rating !== null ? Number(r.rating) : 0,
        reviewCount: r.review_count || 0,
        colors,
        createdAt: r.created_at,
        soldQty: Number(r.sold_qty || 0),
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error('Failed to fetch top-selling products', err);
    res.status(500).json({ error: 'Failed to fetch top-selling products' });
  }
});

// ===== RESELLER ROUTES (MUST BE BEFORE /:id) =====
function requireReseller(req, res, next) {
  const user = req.user || {};
  if (user.role && user.role === 'reseller') return next();
  return res.status(403).json({ error: 'Reseller privileges required' });
}

// List reseller products
router.get('/reseller', verifyToken, requireReseller, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const [rows] = await pool.execute(
      `SELECT p.*, u.first_name, u.last_name, u.email AS reseller_email, rp.store_name
       FROM products p
       LEFT JOIN users u ON p.reseller_id = u.id
       LEFT JOIN reseller_profiles rp ON rp.user_id = u.id
       WHERE p.reseller_id = ? ORDER BY p.id DESC`,
      [userId]
    );
    const hasIsReseller = await hasIsApprovedColumn();
    const parsed = rows.map((r) => {
      const rawImages = (() => { try { return r.images ? JSON.parse(r.images) : []; } catch { return []; } })();
      const rawColors = (() => { try { return r.colors ? JSON.parse(r.colors) : []; } catch { return []; } })();
      const images = sanitizeImages(rawImages) || [];
      const colors = sanitizeColors(rawColors) || [];
      const sellerName = (r.store_name && r.store_name.trim()) || (`${r.first_name || ''} ${r.last_name || ''}`.trim()) || r.reseller_email || 'Reseller';
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        stock: r.stock,
        inStock: !!Number(r.in_stock),
        category: r.category,
        images,
        originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
        rating: r.rating !== null ? Number(r.rating) : 0,
        reviewCount: r.review_count || 0,
        colors,
        is_approved: hasIsReseller ? Number(r.is_approved) === 1 : true,
        sellerName,
        resellerId: r.reseller_id,
        createdAt: r.created_at,
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error('Failed to fetch reseller products', err);
    res.status(500).json({ error: 'Failed to fetch reseller products' });
  }
});

// Create product as reseller
router.post('/reseller', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput } = req.body;
  if (!name || typeof price === 'undefined') return res.status(400).json({ error: 'Missing required fields: name, price' });
  try {
    const imagesJson = imagesInput && Array.isArray(imagesInput) ? JSON.stringify(imagesInput) : null;
    const colorsJson = colorsInput && Array.isArray(colorsInput) ? JSON.stringify(colorsInput) : null;
    const in_stock = Number(stock) > 0 ? 1 : 0;
    const is_approved = 0;
    const hasIsInsert = await hasIsApprovedColumn();
    let insertSql;
    let insertParams;
    if (hasIsInsert) {
      insertSql = 'INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors, in_stock, reseller_id, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      insertParams = [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock, userId, is_approved];
    } else {
      insertSql = 'INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors, in_stock, reseller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      insertParams = [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock, userId];
    }
    const [result] = await pool.execute(insertSql, insertParams);
    const [rows2] = await pool.execute(
      `SELECT p.*, u.first_name, u.last_name, u.email AS reseller_email, rp.store_name
       FROM products p
       LEFT JOIN users u ON p.reseller_id = u.id
       LEFT JOIN reseller_profiles rp ON rp.user_id = u.id
       WHERE p.id = ?`,
      [result.insertId]
    );
    const r = rows2[0];
    const rawImages = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
    const rawColors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
    const parsed = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
      inStock: !!Number(r.in_stock),
      category: r.category,
      images: rawImages,
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors: rawColors,
      is_approved: Number(r.is_approved) === 1,
      resellerId: r.reseller_id,
      sellerName: (r.store_name && r.store_name.trim()) || (`${r.first_name || ''} ${r.last_name || ''}`.trim()) || r.reseller_email || 'Reseller',
      createdAt: r.created_at,
    };
    res.status(201).json(parsed);
  } catch (err) {
    console.error('Failed to create reseller product', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product as reseller
router.put('/reseller/:id', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  const { id } = req.params;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput, in_stock } = req.body;
  try {
    const [rows] = await pool.execute('SELECT reseller_id FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (rows[0].reseller_id !== userId) return res.status(403).json({ error: 'Not authorized to update this product' });
    const imagesJson = imagesInput && Array.isArray(imagesInput) ? JSON.stringify(imagesInput) : null;
    const colorsJson = colorsInput && Array.isArray(colorsInput) ? JSON.stringify(colorsInput) : null;
    const inStockVal = typeof in_stock !== 'undefined' ? (in_stock ? 1 : 0) : (Number(stock) > 0 ? 1 : 0);
    const sql = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, images = ?, original_price = ?, rating = ?, review_count = ?, colors = ?, in_stock = ? WHERE id = ?';
    const params = [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, inStockVal, id];
    const [result] = await pool.execute(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to update reseller product', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product as reseller
router.delete('/reseller/:id', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT reseller_id FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (rows[0].reseller_id !== userId) return res.status(403).json({ error: 'Not authorized to delete this product' });
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete reseller product', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const r = rows[0];
    // Hide unapproved reseller products from public product detail
      // Hide unapproved reseller products from public product detail (only when column exists)
      const hasIsForId = await hasIsApprovedColumn();
      if (hasIsForId && r.reseller_id && Number(r.is_approved) !== 1) return res.status(404).json({ error: 'Product not found' });
    const rawImages = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
    const rawColors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
    const images = sanitizeImages(rawImages) || [];
    const colors = sanitizeColors(rawColors) || [];
    const out = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
      category: r.category,
      images,
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors,
      is_approved: hasIsForId ? Number(r.is_approved) === 1 : true,
      createdAt: r.created_at,
    };
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin can create and optionally assign reseller_id)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput, resellerId, reseller_id } = req.body;
  // accept either camelCase `inStock` or snake_case `in_stock` in the payload
  const { sanitizeInStock } = require('../utils/validate');
  const inStockInput = typeof req.body.inStock !== 'undefined' ? req.body.inStock : req.body.in_stock;
  // determine stored tinyint value using sanitizer; fall back to stock numeric test
  let in_stock = sanitizeInStock(inStockInput);
  if (in_stock === null) in_stock = Number(stock) > 0 ? 1 : 0;
  if (!name || typeof price === 'undefined') {
    return res.status(400).json({ error: 'Missing required fields: name, price' });
  }
  try {
    console.info(`Create product request by user=${req.user && req.user.id}`, { name, price, stock, category });
    // sanitize inputs
    const sanitizedImages = sanitizeImages(imagesInput);
    const imagesJson = sanitizedImages ? JSON.stringify(sanitizedImages) : null;
    console.debug('Images JSON for insert:', imagesJson);
    const sanitizedColors = sanitizeColors(colorsInput);
    const colorsJson = sanitizedColors ? JSON.stringify(sanitizedColors) : null;
    // allow admin to set reseller_id via `resellerId` or `reseller_id`
    const resellerIdToUse = typeof resellerId !== 'undefined' ? resellerId : reseller_id || null;
    // Admin-created products should be approved by default
    const is_approved_val = 1;
    const hasIsInsert = await hasIsApprovedColumn();
    let insertSql;
    let insertParams;
    if (hasIsInsert) {
      insertSql = 'INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors, in_stock, reseller_id, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      insertParams = [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock, resellerIdToUse, is_approved_val];
    } else {
      insertSql = 'INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors, in_stock, reseller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      insertParams = [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock, resellerIdToUse];
    }
    const [result] = await pool.execute(insertSql, insertParams);
    console.info('Product inserted id=', result.insertId);
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    const r = rows[0];
    const rawImages = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
    const rawColors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
    const images = sanitizeImages(rawImages) || [];
    const colors = sanitizeColors(rawColors) || [];
    const out = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
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
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
// Update product (admin may update reseller_id)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput, resellerId, reseller_id } = req.body;
  // accept either camelCase `inStock` or snake_case `in_stock` in the payload
  const inStockInput = typeof req.body.inStock !== 'undefined' ? req.body.inStock : req.body.in_stock;
  const in_stock = typeof inStockInput !== 'undefined' ? (inStockInput ? 1 : 0) : (Number(stock) > 0 ? 1 : 0);
  const is_approved_input = typeof req.body.is_approved !== 'undefined' ? req.body.is_approved : (typeof req.body.isApproved !== 'undefined' ? req.body.isApproved : undefined);
  try {
    console.info(`Update product request by user=${req.user && req.user.id} id=${id}`);
    // sanitize inputs for update
    const sanitizedImagesU = sanitizeImages(imagesInput);
    const imagesJson = sanitizedImagesU ? JSON.stringify(sanitizedImagesU) : null;
    console.debug('Images JSON for update:', imagesJson);
    const sanitizedColorsU = sanitizeColors(colorsInput);
    const colorsJson = sanitizedColorsU ? JSON.stringify(sanitizedColorsU) : null;
    // allow admin to update reseller_id if provided
    const resellerIdToUse = typeof resellerId !== 'undefined' ? resellerId : reseller_id;
    let sql = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, images = ?, original_price = ?, rating = ?, review_count = ?, colors = ?, in_stock = ?';
    const params = [name, description || null, price, stock, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock];
    if (typeof resellerIdToUse !== 'undefined') {
      sql += ', reseller_id = ?';
      params.push(resellerIdToUse);
    }
    if (typeof is_approved_input !== 'undefined') {
      const canUseIs = await hasIsApprovedColumn();
      if (canUseIs) {
        sql += ', is_approved = ?';
        params.push(is_approved_input ? 1 : 0);
      }
    }
    sql += ' WHERE id = ?';
    params.push(id);
    const [result] = await pool.execute(sql, params);
      console.info('Product update affectedRows=', result.affectedRows);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    const r = rows[0];
    const rawImages = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
    const rawColors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
    const images = sanitizeImages(rawImages) || [];
    const colors = sanitizeColors(rawColors) || [];
    const out = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
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
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;

function requireReseller(req, res, next) {
  const user = req.user || {};
  if (user.role && user.role === 'reseller') return next();
  return res.status(403).json({ error: 'Reseller privileges required' });
}

// List reseller products
router.get('/reseller', verifyToken, requireReseller, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    // join with users and reseller_profiles to include seller/store name
    const [rows] = await pool.execute(
      `SELECT p.*, u.first_name, u.last_name, u.email AS reseller_email, rp.store_name
       FROM products p
       LEFT JOIN users u ON p.reseller_id = u.id
       LEFT JOIN reseller_profiles rp ON rp.user_id = u.id
       WHERE p.reseller_id = ? ORDER BY p.id DESC`,
      [userId]
    );
    const hasIsReseller = await hasIsApprovedColumn();
    const parsed = rows.map((r) => {
      const rawImages = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
      const rawColors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
      const sellerName = (r.store_name && r.store_name.trim()) || (`${r.first_name || ''} ${r.last_name || ''}`.trim()) || r.reseller_email || 'Reseller';
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        stock: r.stock,
        inStock: !!Number(r.in_stock),
        category: r.category,
        images: rawImages,
        originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
        rating: r.rating !== null ? Number(r.rating) : 0,
        reviewCount: r.review_count || 0,
        colors: rawColors,
        is_approved: hasIsReseller ? Number(r.is_approved) === 1 : true,
        sellerName,
        resellerId: r.reseller_id,
        createdAt: r.created_at,
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error('Failed to fetch reseller products', err);
    res.status(500).json({ error: 'Failed to fetch reseller products' });
  }
});

// Create product as reseller
router.post('/reseller', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput } = req.body;
  if (!name || typeof price === 'undefined') return res.status(400).json({ error: 'Missing required fields: name, price' });
  try {
    const imagesJson = imagesInput && Array.isArray(imagesInput) ? JSON.stringify(imagesInput) : null;
    const colorsJson = colorsInput && Array.isArray(colorsInput) ? JSON.stringify(colorsInput) : null;
    const in_stock = Number(stock) > 0 ? 1 : 0;
    // Reseller-created products are not approved by default; admin must approve.
    const is_approved = 0;
    const hasIsInsert = await hasIsApprovedColumn();
    let insertSql;
    let insertParams;
    if (hasIsInsert) {
      insertSql = 'INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors, in_stock, reseller_id, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      insertParams = [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock, userId, is_approved];
    } else {
      insertSql = 'INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors, in_stock, reseller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      insertParams = [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock, userId];
    }
    const [result] = await pool.execute(insertSql, insertParams);
    // return full product object (including seller info) so frontend can display it immediately
    const [rows2] = await pool.execute(
      `SELECT p.*, u.first_name, u.last_name, u.email AS reseller_email, rp.store_name
       FROM products p
       LEFT JOIN users u ON p.reseller_id = u.id
       LEFT JOIN reseller_profiles rp ON rp.user_id = u.id
       WHERE p.id = ?`,
      [result.insertId]
    );
    const r = rows2[0];
    const rawImages = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
    const rawColors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
    const parsed = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
      inStock: !!Number(r.in_stock),
      category: r.category,
      images: rawImages,
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors: rawColors,
      is_approved: Number(r.is_approved) === 1,
      resellerId: r.reseller_id,
      sellerName: (r.store_name && r.store_name.trim()) || (`${r.first_name || ''} ${r.last_name || ''}`.trim()) || r.reseller_email || 'Reseller',
      createdAt: r.created_at,
    };
    res.status(201).json(parsed);
  } catch (err) {
    console.error('Failed to create reseller product', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product as reseller
router.put('/reseller/:id', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  const { id } = req.params;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput, in_stock } = req.body;
  try {
    // verify ownership
    const [rows] = await pool.execute('SELECT reseller_id FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (rows[0].reseller_id !== userId) return res.status(403).json({ error: 'Not authorized to update this product' });
    const imagesJson = imagesInput && Array.isArray(imagesInput) ? JSON.stringify(imagesInput) : null;
    const colorsJson = colorsInput && Array.isArray(colorsInput) ? JSON.stringify(colorsInput) : null;
    const inStockVal = typeof in_stock !== 'undefined' ? (in_stock ? 1 : 0) : (Number(stock) > 0 ? 1 : 0);
    const sql = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, images = ?, original_price = ?, rating = ?, review_count = ?, colors = ?, in_stock = ? WHERE id = ?';
    const params = [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, inStockVal, id];
    const [result] = await pool.execute(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to update reseller product', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product as reseller
router.delete('/reseller/:id', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT reseller_id FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (rows[0].reseller_id !== userId) return res.status(403).json({ error: 'Not authorized to delete this product' });
  await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete reseller product', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});