-- Create telegram_users table for reseller/admin bot mapping
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
