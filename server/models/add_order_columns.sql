-- Migration: add order_number and payment_method to orders table (idempotent on MySQL 8+)
ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `order_number` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `payment_method` VARCHAR(100) DEFAULT NULL;

-- Optional: add index for faster lookups by order_number
ALTER TABLE `orders` ADD INDEX IF NOT EXISTS `idx_orders_order_number` (`order_number`(50));
