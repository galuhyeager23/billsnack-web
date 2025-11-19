-- Add is_approved column to products to allow admin approval of reseller products
-- Default to 1 (approved) for existing/admin products; reseller-created products will be set to 0 on creation
ALTER TABLE `products` ADD COLUMN `is_approved` TINYINT(1) NOT NULL DEFAULT 1;
