/* eslint-env node */
const express = require('express');
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const SALT_ROUNDS = process.env.SALT_ROUNDS ? Number(process.env.SALT_ROUNDS) : 10;

// Register
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    // check if exists
    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email, hash, firstName || null, lastName || null]
    );

    const user = { id: result.insertId, email, firstName: firstName || null, lastName: lastName || null };
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
    const [rows] = await pool.execute('SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const userRow = rows[0];
    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const user = { id: userRow.id, email: userRow.email, firstName: userRow.first_name, lastName: userRow.last_name, role: userRow.role };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
