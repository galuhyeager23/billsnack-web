-- create_schema.sql
-- Simple, runnable schema for Billsnack (MySQL)
-- Run with:
--   mysql -u root -p < create_schema.sql
-- or copy into your container and run there.

-- Create database
CREATE DATABASE IF NOT EXISTS `billsnack` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `billsnack`;

-- Create user for development (adjust password for production)
-- NOTE: avoid empty passwords in production. Set a secure password instead.
CREATE USER IF NOT EXISTS 'billsnack'@'localhost' IDENTIFIED BY '';
CREATE USER IF NOT EXISTS 'billsnack'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON `billsnack`.* TO 'billsnack'@'localhost';
GRANT ALL PRIVILEGES ON `billsnack`.* TO 'billsnack'@'%';
FLUSH PRIVILEGES;

-- PRODUCTS table
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(255) DEFAULT NULL,
  -- images stored as JSON array; elements can be strings (URLs) or objects { original, thumb }
  images JSON DEFAULT NULL,
  original_price DECIMAL(10,2) DEFAULT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  in_stock TINYINT(1) DEFAULT 1,
  colors JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- USERS table
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  username VARCHAR(100) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  gender VARCHAR(50) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  postal_code VARCHAR(20) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  province VARCHAR(100) DEFAULT NULL,
  profile_image LONGTEXT DEFAULT NULL,
  profile_image_url VARCHAR(2048) DEFAULT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example seed product (images as array of strings)
INSERT INTO products (name, description, price, stock, category, images, original_price, rating, review_count, colors)
VALUES (
  'Contoh Keripik Pedas',
  'Keripik pedas rasa original, gurih dan renyah.',
  12000.00,
  50,
  'Keripik',
  JSON_ARRAY(
    'https://example.com/images/keripik-1.jpg',
    'https://example.com/images/keripik-2.jpg'
  ),
  15000.00,
  4.6,
  25,
  JSON_ARRAY(JSON_OBJECT('name','Original','hex','#FF8C00'))
);

-- Example seed admin user (replace <BCRYPT_HASH> with actual bcrypt hash)
-- Generate a bcrypt hash in Node: require('bcrypt').hash('your-password', 10).then(h => console.log(h))
INSERT INTO users (email, password_hash, first_name, role, created_at)
SELECT 'admin@billsnack.id', '<BCRYPT_HASH>', 'Admin', 'admin', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@billsnack.id');

-- End of file
