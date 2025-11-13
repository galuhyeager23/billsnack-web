#!/bin/bash
# Bot Reseller Security Setup - Automated Script
# Run this to setup database for bot reseller security

set -e

echo "🔐 Bot Reseller - Database Security Setup"
echo "=========================================="
echo ""

# Configuration
DB_USER=${DB_USER:-billsnack}
DB_HOST=${DB_HOST:-localhost}
DB_NAME=${DB_NAME:-billsnack}

# Check if mysql is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client not found. Please install mysql-client."
    exit 1
fi

echo "📝 Configuration:"
echo "   Database User: $DB_USER"
echo "   Database Host: $DB_HOST"
echo "   Database Name: $DB_NAME"
echo ""

# Check connection
echo "🔌 Testing database connection..."
if mysql -h "$DB_HOST" -u "$DB_USER" -p -e "SELECT 1;" &> /dev/null; then
    echo "✅ Database connection OK"
else
    echo "❌ Cannot connect to database"
    exit 1
fi

echo ""
echo "🔄 Running migrations..."
echo ""

# Migration 1: Add reseller_id to products
echo "1️⃣ Adding reseller_id column to products table..."
mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_NAME" << 'EOF'
-- Add reseller_id column to products table
ALTER TABLE `products` ADD COLUMN `reseller_id` INT UNSIGNED DEFAULT NULL;

-- Add foreign key constraint
ALTER TABLE `products` ADD CONSTRAINT `fk_products_reseller_id` 
FOREIGN KEY (`reseller_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Add indexes for faster queries
CREATE INDEX `idx_products_reseller_id` ON `products` (`reseller_id`);
CREATE INDEX `idx_products_reseller_in_stock` ON `products` (`reseller_id`, `in_stock`);

SELECT "✅ Reseller_id column created successfully" AS status;
EOF

echo ""

# Migration 2: Create telegram_users table
echo "2️⃣ Creating telegram_users table..."
mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_NAME" << 'EOF'
-- Create telegram_users table to map Telegram chat IDs to resellers
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

SELECT "✅ telegram_users table created successfully" AS status;
EOF

echo ""
echo "✅ All migrations completed successfully!"
echo ""

# Show summary
echo "📊 Database Summary:"
echo "===================="
echo ""

mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_NAME" << 'EOF'
-- Show products table structure
SELECT "Products table structure:" AS info;
DESCRIBE products;
SELECT "" AS separator;

-- Show telegram_users table structure  
SELECT "Telegram users table structure:" AS info;
DESCRIBE telegram_users;
SELECT "" AS separator;

-- Show indexes
SELECT "Indexes on products:" AS info;
SHOW INDEX FROM products WHERE Column_name IN ('reseller_id');
SELECT "" AS separator;

SELECT "Indexes on telegram_users:" AS info;
SHOW INDEX FROM telegram_users;
EOF

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in .env:"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - TELEGRAM_RESELLER_BOT_TOKEN"
echo ""
echo "2. Update product routes to set reseller_id when creating products"
echo ""
echo "3. Test bot with: npm run dev"
echo ""
echo "For more info, see:"
echo "   - TELEGRAM_RESELLER_BOT_SETUP.md"
echo "   - TELEGRAM_SECURITY.md"
echo "   - BOT_SECURITY_SUMMARY.md"
echo ""
