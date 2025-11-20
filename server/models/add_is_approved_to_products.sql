-- Add is_approved column to products table
-- This allows admin to approve/reject reseller products

ALTER TABLE `products` 
ADD COLUMN `is_approved` TINYINT(1) NOT NULL DEFAULT 1 AFTER `created_at`;

-- Set all existing admin products (reseller_id IS NULL) to approved
UPDATE `products` 
SET `is_approved` = 1 
WHERE `reseller_id` IS NULL;

-- Set existing reseller products to approved (backwards compatibility)
UPDATE `products` 
SET `is_approved` = 1 
WHERE `reseller_id` IS NOT NULL;
