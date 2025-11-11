-- Migration: enlarge profile_image column to LONGTEXT to accommodate base64 image strings
-- Run with: mysql -u USER -p billsnack < alter_profile_image_type.sql

-- Change `profile_image` to LONGTEXT. This supports very large text (e.g., base64 image payloads).
ALTER TABLE `users`
  MODIFY COLUMN `profile_image` LONGTEXT DEFAULT NULL;

-- Note: `profile_image_url` remains VARCHAR(1024) for URL references.
