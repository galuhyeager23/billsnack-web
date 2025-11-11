# Database setup (MySQL)

This repository expects a MySQL database. The `server/schema.sql` file defines the necessary tables.

Quick steps to create schema and seed an admin user:

1. Create a database (example):

   - Using mysql client:
     mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS billsnack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

2. Run the schema file:

   mysql -u USER -p billsnack < server/schema.sql

3. Seed an admin user (uses bcrypt hash):

   - Using the provided Node seed script (recommended):
     From project root run:

     ADMIN_EMAIL=admin@billsnack.id ADMIN_PASSWORD=admin123 node server/scripts/seed_admin.js

   - The script uses the same DB connection settings as the app (see `.env` or environment variables `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`).

Notes:

- The default seeded admin password is `admin123` unless you override `ADMIN_PASSWORD`.
- After initial setup, change the admin password and set a secure `JWT_SECRET` in production.
- The app uses bcrypt to compare passwords. The seed script generates a proper bcrypt hash.
