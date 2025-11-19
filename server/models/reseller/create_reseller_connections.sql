-- Create reseller_connections table
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
