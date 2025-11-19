-- Billsnack All-in-One SQL Setup
-- Import this single file in phpMyAdmin for a fresh database setup.
-- Order: schema -> admin notifications -> user migrations -> telegram users -> reseller columns & connections

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1) Core schema (users, products, orders, order_items, reviews, transactions)
-- -----------------------------------------------------------------------------
-- users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `first_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) DEFAULT NULL,
  `username` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `gender` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `postal_code` VARCHAR(20) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `province` VARCHAR(100) DEFAULT NULL,
  `profile_image` LONGTEXT DEFAULT NULL,
  `profile_image_url` VARCHAR(1024) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'user',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `idx_users_email` ON `users` (`email`);

-- products table
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `stock` INT NOT NULL DEFAULT 0,
  `category` VARCHAR(255) DEFAULT NULL,
  `images` LONGTEXT DEFAULT NULL,
  `original_price` DECIMAL(12,2) DEFAULT NULL,
  `rating` DECIMAL(4,2) DEFAULT 0,
  `review_count` INT DEFAULT 0,
  `colors` LONGTEXT DEFAULT NULL,
  `in_stock` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trigger: keep `in_stock` consistent with `stock` on insert/update
DELIMITER $$
DROP TRIGGER IF EXISTS `trg_products_set_in_stock`$$
CREATE TRIGGER `trg_products_set_in_stock` BEFORE INSERT ON `products`
FOR EACH ROW
BEGIN
  SET NEW.in_stock = IF(NEW.stock IS NOT NULL AND NEW.stock > 0, 1, 0);
END$$

DROP TRIGGER IF EXISTS `trg_products_update_in_stock`$$
CREATE TRIGGER `trg_products_update_in_stock` BEFORE UPDATE ON `products`
FOR EACH ROW
BEGIN
  SET NEW.in_stock = IF(NEW.stock IS NOT NULL AND NEW.stock > 0, 1, 0);
END$$
DELIMITER ;

-- orders table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(100) DEFAULT NULL,
  `payment_method` VARCHAR(100) DEFAULT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `province` VARCHAR(255) DEFAULT NULL,
  `postal_code` VARCHAR(50) DEFAULT NULL,
  `subtotal` DECIMAL(12,2) DEFAULT 0,
  `discount` DECIMAL(12,2) DEFAULT 0,
  `delivery_fee` DECIMAL(12,2) DEFAULT 0,
  `total` DECIMAL(12,2) DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'Menunggu',
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_user` (`user_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED DEFAULT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `unit_price` DECIMAL(12,2) DEFAULT 0,
  `quantity` INT DEFAULT 1,
  `total_price` DECIMAL(12,2) DEFAULT 0,
  `selected_options` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- reviews
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `rating` TINYINT NOT NULL DEFAULT 0,
  `comment` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_product` (`product_id`),
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- transactions (optional)
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT NULL,
  `provider` VARCHAR(255) DEFAULT NULL,
  `amount` DECIMAL(12,2) DEFAULT 0,
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transactions_order` (`order_id`),
  CONSTRAINT `fk_transactions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2) Admin notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'order_purchase',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `order_id` INT UNSIGNED DEFAULT NULL,
  `product_id` INT UNSIGNED DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `action_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_notifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `order_purchase_enabled` TINYINT(1) DEFAULT 1,
  `stock_alert_enabled` TINYINT(1) DEFAULT 1,
  `telegram_notifications` TINYINT(1) DEFAULT 1,
  `email_notifications` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_id` (`user_id`),
  CONSTRAINT `fk_prefs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3) User migrations (profile image/is_active/reseller_profiles)
-- -----------------------------------------------------------------------------
-- Ensure profile_image is LONGTEXT
ALTER TABLE `users` MODIFY COLUMN `profile_image` LONGTEXT DEFAULT NULL;

-- Add is_active flag
ALTER TABLE `users` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;

-- Reseller profiles (optional)
CREATE TABLE IF NOT EXISTS `reseller_profiles` (
  `user_id` INT UNSIGNED NOT NULL,
  `store_name` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_reseller_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 4) Telegram users (reseller/admin bot mapping)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `telegram_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `chat_id` BIGINT NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `bot_type` VARCHAR(50) NOT NULL DEFAULT 'reseller',
  `username` VARCHAR(255) DEFAULT NULL,
  `first_name` VARCHAR(255) DEFAULT NULL,
  `last_name` VARCHAR(255) DEFAULT NULL,
  `verified_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_chat_user` (`chat_id`, `user_id`),
  KEY `fk_telegram_users_user_id` (`user_id`),
  CONSTRAINT `fk_telegram_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 5) Reseller columns & connections
-- -----------------------------------------------------------------------------
ALTER TABLE `products` ADD COLUMN `reseller_id` INT UNSIGNED DEFAULT NULL;

ALTER TABLE `products` ADD CONSTRAINT `fk_products_reseller_id`
FOREIGN KEY (`reseller_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

CREATE INDEX `idx_products_reseller_id` ON `products` (`reseller_id`);
CREATE INDEX `idx_products_reseller_in_stock` ON `products` (`reseller_id`, `in_stock`);

CREATE TABLE IF NOT EXISTS `reseller_connections` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_a` INT UNSIGNED NOT NULL,
  `user_b` INT UNSIGNED NOT NULL,
  `status` VARCHAR(50) DEFAULT 'connected',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_pair` (`user_a`,`user_b`),
  KEY `idx_user_a` (`user_a`),
  KEY `idx_user_b` (`user_b`),
  CONSTRAINT `fk_conn_user_a` FOREIGN KEY (`user_a`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conn_user_b` FOREIGN KEY (`user_b`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- Helpful index
CREATE INDEX `idx_users_email_after_setup` ON `users` (`email`);

-- End of all-in-one setup.

-- -----------------------------------------------------------------------------
-- Seed admin placeholder
-- After importing this SQL, run `node server/scripts/seed_admin.js` to set a bcrypt password
INSERT INTO `users` (email, password_hash, first_name, role, is_active, created_at)
VALUES ('admin@billsnack.id', NULL, 'Admin', 'admin', 1, NOW());
