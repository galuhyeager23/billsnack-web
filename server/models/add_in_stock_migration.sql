-- add_in_stock_migration.sql
-- Adds an in_stock boolean (TINYINT) column to products if missing.

-- Safe migration that adds `in_stock` only when missing. This uses INFORMATION_SCHEMA and a prepared statement.
-- It should be safe to run on MySQL servers that allow multiple statements in this script.

SET @col_exists = (
	SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'in_stock'
);
SET @sql_stmt = IF(@col_exists = 0,
	'ALTER TABLE products ADD COLUMN in_stock TINYINT(1) NOT NULL DEFAULT 1',
	'SELECT "in_stock_exists"'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Optionally, set sensible values for existing rows where needed:
-- UPDATE products SET in_stock = CASE WHEN stock > 0 THEN 1 ELSE 0 END WHERE in_stock IS NULL;
