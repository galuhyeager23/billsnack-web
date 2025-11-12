/* eslint-env node */
const express = require('express');
const pool = require('../db');
const router = express.Router();
const { sanitizeImages, sanitizeColors } = require('../utils/validate');
const auth = require('./auth');

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
    const [rows] = await pool.execute('SELECT * FROM products ORDER BY id DESC');
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
        colors,
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
    const sql = `
      SELECT p.*, COALESCE(SUM(oi.quantity), 0) AS sold_qty
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY p.id
      ORDER BY sold_qty DESC
      LIMIT ?`;
    const [rows] = await pool.execute(sql, [limit]);

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

// Get single product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
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
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput } = req.body;
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
    const [result] = await pool.execute(
      'INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock]
    );
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
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput } = req.body;
  // accept either camelCase `inStock` or snake_case `in_stock` in the payload
  const inStockInput = typeof req.body.inStock !== 'undefined' ? req.body.inStock : req.body.in_stock;
  const in_stock = typeof inStockInput !== 'undefined' ? (inStockInput ? 1 : 0) : (Number(stock) > 0 ? 1 : 0);
  try {
    console.info(`Update product request by user=${req.user && req.user.id} id=${id}`);
    // sanitize inputs for update
    const sanitizedImagesU = sanitizeImages(imagesInput);
    const imagesJson = sanitizedImagesU ? JSON.stringify(sanitizedImagesU) : null;
    console.debug('Images JSON for update:', imagesJson);
    const sanitizedColorsU = sanitizeColors(colorsInput);
    const colorsJson = sanitizedColorsU ? JSON.stringify(sanitizedColorsU) : null;
    const [result] = await pool.execute(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, images = ?, original_price = ?, rating = ?, review_count = ?, colors = ?, in_stock = ? WHERE id = ?',
      [name, description || null, price, stock, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, in_stock, id]
    );
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