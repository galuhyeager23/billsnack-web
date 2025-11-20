-- Add seller_name column to products table
-- This allows admin products to have a stored seller/store name

ALTER TABLE `products` 
ADD COLUMN `seller_name` VARCHAR(255) DEFAULT NULL AFTER `in_stock`;

-- Update existing admin products (reseller_id IS NULL) to have 'BillSnack Store' as default
UPDATE `products` 
SET `seller_name` = 'BillSnack Store' 
WHERE `reseller_id` IS NULL AND `seller_name` IS NULL;
