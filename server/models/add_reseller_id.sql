-- Add reseller_id column to products table
-- This links products to specific resellers

ALTER TABLE `products` ADD COLUMN `reseller_id` INT UNSIGNED DEFAULT NULL;

-- Add foreign key constraint (if users table has id as primary key)
ALTER TABLE `products` ADD CONSTRAINT `fk_products_reseller_id` 
FOREIGN KEY (`reseller_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX `idx_products_reseller_id` ON `products` (`reseller_id`);

-- Add index for combined queries
CREATE INDEX `idx_products_reseller_in_stock` ON `products` (`reseller_id`, `in_stock`);
