-- Migration: enlarge users.profile_image to LONGTEXT and add is_active flag
-- Run: mysql -u USER -p billsnack < 20251117_modify_users_profile_image_and_add_is_active.sql

SET FOREIGN_KEY_CHECKS = 0;

-- Make profile_image a LONGTEXT to allow large base64 payloads (if you choose to allow them)
ALTER TABLE `users` MODIFY COLUMN `profile_image` LONGTEXT DEFAULT NULL;

-- Add is_active flag to manage enabled/disabled accounts explicitly
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1;

-- Optional: create reseller_profiles for richer reseller metadata (store name, address, phone)
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

SET FOREIGN_KEY_CHECKS = 1;

-- Helpful checks (run after migration):
-- SHOW COLUMNS FROM users LIKE 'profile_image';
-- SHOW COLUMNS FROM users LIKE 'is_active';
-- SHOW TABLES LIKE 'reseller_profiles';
