/*
  Usage: node server/scripts/seed_admin.js
  Creates an admin user if one doesn't exist. Uses bcrypt to hash password.
  Edit ADMIN_EMAIL and ADMIN_PASSWORD below if you want different credentials.
*/

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@billsnack.id';
// Per request, default seeded admin password set to a short dev password. You can
// override with SEED_ADMIN_PASSWORD in the environment if needed.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin';
const SALT_ROUNDS = process.env.SALT_ROUNDS ? Number(process.env.SALT_ROUNDS) : 10;

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'billsnack',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'billsnack',
  });

  try {
    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
    if (rows.length > 0) {
      console.log(`Admin user already exists with email ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const [result] = await connection.execute(
      'INSERT INTO users (email, password_hash, first_name, role) VALUES (?, ?, ?, ?)',
      [ADMIN_EMAIL, hash, 'Admin', 'admin']
    );
    console.log(`Created admin user id=${result.insertId} email=${ADMIN_EMAIL} password=${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin user', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
