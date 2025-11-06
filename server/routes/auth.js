/* eslint-env node */
const express = require('express');
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const SALT_ROUNDS = process.env.SALT_ROUNDS ? Number(process.env.SALT_ROUNDS) : 10;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@billsnack.id';

// Register
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, username, phone, gender, profileImage, profileImageUrl } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    // check if exists
    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, username, phone, gender, profile_image, profile_image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hash, firstName || null, lastName || null, username || null, phone || null, gender || null, profileImage || null, profileImageUrl || null]
    );

    const user = {
      id: result.insertId,
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      username: username || null,
      phone: phone || null,
      gender: gender || null,
      profileImage: profileImage || profileImageUrl || null,
    };
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const [rows] = await pool.execute(
      'SELECT id, email, password_hash, first_name, last_name, username, phone, gender, address, postal_code, city, province, profile_image, profile_image_url, role FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const userRow = rows[0];
    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // If this request is an admin login attempt (Admin UI sends admin: true),
    // require that the user has role 'admin' and matches the configured ADMIN_EMAIL.
    const isAdminLogin = req.body && req.body.admin;
    if (isAdminLogin) {
      if (userRow.role !== 'admin' || (userRow.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const user = {
      id: userRow.id,
      email: userRow.email,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      username: userRow.username,
      phone: userRow.phone,
      gender: userRow.gender,
      address: userRow.address,
      postalCode: userRow.postal_code,
      city: userRow.city,
      province: userRow.province,
      profileImage: userRow.profile_image || userRow.profile_image_url || null,
      role: userRow.role,
    };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Simple JWT verification middleware for protected routes
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.error('Token verify error', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Update profile (protected) - accepts fields and updates users table
router.put('/profile', verifyToken, async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const allowedMap = {
    firstName: 'first_name',
    lastName: 'last_name',
    username: 'username',
    phone: 'phone',
    gender: 'gender',
    address: 'address',
    postalCode: 'postal_code',
    city: 'city',
    province: 'province',
    profileImage: 'profile_image',
    profileImageUrl: 'profile_image_url',
  };

  const sets = [];
  const params = [];
  for (const key of Object.keys(req.body || {})) {
    if (allowedMap[key]) {
      sets.push(`${allowedMap[key]} = ?`);
      params.push(req.body[key]);
    }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  try {
    const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = ?`;
    params.push(userId);
    await pool.execute(sql, params);

    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, username, phone, gender, address, postal_code, city, province, profile_image, profile_image_url, role FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const r = rows[0];
    const updated = {
      id: r.id,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      username: r.username,
      phone: r.phone,
      gender: r.gender,
      address: r.address,
      postalCode: r.postal_code,
      city: r.city,
      province: r.province,
      profileImage: r.profile_image || r.profile_image_url || null,
      role: r.role,
    };
    res.json({ user: updated });
  } catch (err) {
    console.error('Profile update error', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// expose verifyToken for other route modules (attach to router function object)
module.exports = router;
module.exports.verifyToken = verifyToken;
