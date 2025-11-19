-- Add reseller_id column to products and related FK/indexes
-- Note: running these statements twice may produce errors if the column/constraint/index already exists.
ALTER TABLE `products`
  ADD COLUMN `reseller_id` INT UNSIGNED DEFAULT NULL;

ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_reseller_id`
  FOREIGN KEY (`reseller_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

CREATE INDEX `idx_products_reseller_id` ON `products` (`reseller_id`);
CREATE INDEX `idx_products_reseller_in_stock` ON `products` (`reseller_id`, `in_stock`);
