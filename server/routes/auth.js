/* eslint-env node */
const express = require('express');
const supabase = require('../supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const SALT_ROUNDS = process.env.SALT_ROUNDS ? Number(process.env.SALT_ROUNDS) : 10;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@billsnack.id';
const MAX_PROFILE_IMAGE_LEN = 2_000_000;

// Register
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, username, phone, gender, profileImage, profileImageUrl } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    // Check if exists
    const { data: exists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    // Validate profile image size
    if (profileImage && profileImage.length > MAX_PROFILE_IMAGE_LEN) {
      return res.status(400).json({ error: 'Profile image too large. Use a smaller image or provide a profileImageUrl instead.' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hash,
        first_name: firstName || null,
        last_name: lastName || null,
        username: username || null,
        phone: phone || null,
        gender: gender || null,
        profile_image: profileImage || null,
        profile_image_url: profileImageUrl || null
      })
      .select()
      .single();

    if (error) throw error;

    const user = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username,
      phone: data.phone,
      gender: data.gender,
      profileImage: data.profile_image || data.profile_image_url || null,
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
    const { data: userRow, error } = await supabase
      .from('users')
      .select('id, email, password_hash, first_name, last_name, username, phone, gender, address, postal_code, city, province, profile_image, profile_image_url, role')
      .eq('email', email)
      .single();

    if (error || !userRow) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Admin login check
    const isAdminLogin = req.body && req.body.admin;
    if (isAdminLogin) {
      const emailLower = (userRow.email || '').toLowerCase();
      const configuredLower = ADMIN_EMAIL.toLowerCase();
      const isAdminRole = userRow.role === 'admin';
      const emailMatches = emailLower === configuredLower;
      
      if (!isAdminRole && !emailMatches) {
        console.error('Admin login rejected - role or email mismatch', {
          userEmail: userRow.email,
          userRole: userRow.role,
          expectedAdminEmail: ADMIN_EMAIL,
        });
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

// JWT verification middleware
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

// Update profile
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

  if (req.body && req.body.profileImage && req.body.profileImage.length > MAX_PROFILE_IMAGE_LEN) {
    return res.status(400).json({ error: 'Profile image too large. Use a smaller image or provide a profileImageUrl instead.' });
  }

  const updates = {};
  for (const key of Object.keys(req.body || {})) {
    if (allowedMap[key]) {
      updates[allowedMap[key]] = req.body[key];
    }
  }
  
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  try {
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (updateError) throw updateError;

    const { data: updated, error: fetchError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, username, phone, gender, address, postal_code, city, province, profile_image, profile_image_url, role')
      .eq('id', userId)
      .single();

    if (fetchError || !updated) return res.status(404).json({ error: 'User not found' });

    const user = {
      id: updated.id,
      email: updated.email,
      firstName: updated.first_name,
      lastName: updated.last_name,
      username: updated.username,
      phone: updated.phone,
      gender: updated.gender,
      address: updated.address,
      postalCode: updated.postal_code,
      city: updated.city,
      province: updated.province,
      profileImage: updated.profile_image || updated.profile_image_url || null,
      role: updated.role,
    };
    res.json({ user });
  } catch (err) {
    console.error('Profile update error', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;
