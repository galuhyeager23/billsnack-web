-- create_billsnack_with_user.sql
--
-- Usage:
-- 1) Run as a privileged user (root) on your MySQL server or import into the MySQL container
--    Example (host): mysql -u root -p < create_billsnack_with_user.sql
--    Example (docker): docker exec -i <container> mysql -u root -p"rootpassword" < /tmp/create_billsnack_with_user.sql
--
-- This script will:
--  - create the billsnack database if it doesn't exist
--  - create the user 'billsnack'@'localhost' and 'billsnack'@'%' with password 'billsnack_pass'
--  - grant privileges on the billsnack database
--  - create products and users tables

-- Create database with utf8mb4
CREATE DATABASE IF NOT EXISTS `billsnack` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create users for local and remote connections
CREATE USER IF NOT EXISTS 'billsnack'@'localhost' IDENTIFIED BY '';
CREATE USER IF NOT EXISTS 'billsnack'@'%' IDENTIFIED BY '';

-- Grant privileges
GRANT ALL PRIVILEGES ON `billsnack`.* TO 'billsnack'@'localhost';
GRANT ALL PRIVILEGES ON `billsnack`.* TO 'billsnack'@'%';
FLUSH PRIVILEGES;

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
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: insert example product (uncomment to create sample data)
-- INSERT INTO products (name, description, price, stock) VALUES ('Example Snack', 'Tasty sample snack', 5.00, 10);

-- End of script
