-- create_billsnack_with_user.sql
--
-- Usage:
-- 1) Run as a privileged user (root) on your MySQL server or import into the MySQL container
--    Example (host): mysql -u root -p < create_billsnack_with_user.sql
--    Example (docker): docker exec -i <container> mysql -u root -p"rootpassword" < /tmp/create_billsnack_with_user.sql
--
-- This script will:
--  - create the billsnack database if it doesn't exist
--  - create the user 'billsnack'@'localhost' and 'billsnack'@'%' with an empty password (for local dev)
--  - grant privileges on the billsnack database
--  - create products and users tables

-- Create database with utf8mb4
CREATE DATABASE IF NOT EXISTS `billsnack` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create users for local and remote connections (no password for local dev)
CREATE USER IF NOT EXISTS 'billsnack'@'localhost' IDENTIFIED BY '';
CREATE USER IF NOT EXISTS 'billsnack'@'%' IDENTIFIED BY '';

-- Grant privileges
GRANT ALL PRIVILEGES ON `billsnack`.* TO 'billsnack'@'localhost';
GRANT ALL PRIVILEGES ON `billsnack`.* TO 'billsnack'@'%';
FLUSH PRIVILEGES;

-- Do not alter existing user passwords here (preserve existing DB credentials). If you need to set/change password,
-- run ALTER USER manually as appropriate for your environment.

USE `billsnack`;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  -- profile / contact fields
  username VARCHAR(100) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  gender VARCHAR(50) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  postal_code VARCHAR(20) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  province VARCHAR(100) DEFAULT NULL,
  -- store profile image as a long text (data URL) and optional URL path
  profile_image LONGTEXT DEFAULT NULL,
  profile_image_url VARCHAR(2048) DEFAULT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: insert example product (uncomment to create sample data)
-- INSERT INTO products (name, description, price, stock) VALUES ('Example Snack', 'Tasty sample snack', 5.00, 10);

-- End of script

-- If database/table already existed, ensure profile image columns exist (safe for upgrades)
ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `username` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `phone` VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `gender` VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `address` TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `postal_code` VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `city` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `province` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `profile_image` LONGTEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `profile_image_url` VARCHAR(2048) DEFAULT NULL;
