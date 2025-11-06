/* eslint-env node */
const express = require('express');
const pool = require('../db');
const router = express.Router();
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
      const images = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
      const colors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
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

// Get single product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const r = rows[0];
    const images = (() => { try { return r.images ? JSON.parse(r.images) : (r.images || []); } catch { return r.images || []; } })();
    const colors = (() => { try { return r.colors ? JSON.parse(r.colors) : (r.colors || []); } catch { return r.colors || []; } })();
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
  if (!name || typeof price === 'undefined') {
    return res.status(400).json({ error: 'Missing required fields: name, price' });
  }
  try {
  const imagesJson = imagesInput && Array.isArray(imagesInput) ? JSON.stringify(imagesInput) : null;
  const colorsJson = colorsInput && Array.isArray(colorsInput) ? JSON.stringify(colorsInput) : null;
    const [result] = await pool.execute(
      'INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description || null, price, stock || 0, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson]
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
      stock: r.stock,
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
  try {
  const imagesJson = imagesInput && Array.isArray(imagesInput) ? JSON.stringify(imagesInput) : null;
  const colorsJson = colorsInput && Array.isArray(colorsInput) ? JSON.stringify(colorsInput) : null;
    const [result] = await pool.execute(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, images = ?, original_price = ?, rating = ?, review_count = ?, colors = ? WHERE id = ?',
      [name, description || null, price, stock, category || null, imagesJson, typeof originalPrice !== 'undefined' ? originalPrice : null, typeof rating !== 'undefined' ? rating : 0, typeof reviewCount !== 'undefined' ? reviewCount : 0, colorsJson, id]
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