/*
  Seed script to create or update an admin user in the MySQL `users` table.
  Usage (from project root):
    NODE_ENV=development ADMIN_EMAIL=admin@billsnack.id ADMIN_PASSWORD=admin123 node server/scripts/seed_admin.js

  This script uses bcrypt to hash the password and the project's existing DB pool at ../db.js
*/
require('dotenv').config();
const pool = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = process.env.SALT_ROUNDS ? Number(process.env.SALT_ROUNDS) : 10;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@billsnack.id';
// Default password as requested: 'admin' — override with ADMIN_PASSWORD env var if you prefer
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

async function upsertAdmin() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT id, email, role FROM users WHERE email = ?', [ADMIN_EMAIL]);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    if (rows && rows.length > 0) {
      const id = rows[0].id;
      console.log(`Admin user exists (id=${id}), updating password and role.`);
      await conn.execute('UPDATE users SET password_hash = ?, role = ? WHERE id = ?', [hash, 'admin', id]);
      console.log('Admin user updated.');
    } else {
      console.log('Admin user not found - creating new admin user.');
      const [res] = await conn.execute(
        'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
        [ADMIN_EMAIL, hash, 'Admin', 'User', 'admin']
      );
      console.log('Admin created with id=', res.insertId);
    }
  } catch (err) {
    console.error('Failed to upsert admin', err);
    process.exitCode = 2;
  } finally {
    conn.release();
    // close pool to exit cleanly
    await pool.end().catch(() => {});
  }
}

if (require.main === module) {
  upsertAdmin().then(() => console.log('Done.')).catch((e) => { console.error(e); process.exit(1); });
}

