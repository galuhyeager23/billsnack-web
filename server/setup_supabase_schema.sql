-- BillSnack Database Schema for Supabase
-- Run this in Supabase SQL Editor: Settings > SQL Editor > New Query

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  phone TEXT,
  gender TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  province TEXT,
  profile_image TEXT,
  profile_image_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'reseller')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  original_price NUMERIC CHECK (original_price IS NULL OR original_price >= 0),
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  colors JSONB DEFAULT '[]'::jsonb,
  in_stock BOOLEAN DEFAULT true,
  reseller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  seller_name TEXT DEFAULT 'BillSnack Store',
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  payment_method TEXT,
  subtotal NUMERIC DEFAULT 0 CHECK (subtotal >= 0),
  discount NUMERIC DEFAULT 0 CHECK (discount >= 0),
  delivery_fee NUMERIC DEFAULT 0 CHECK (delivery_fee >= 0),
  total NUMERIC DEFAULT 0 CHECK (total >= 0),
  status TEXT DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Selesai', 'Gagal', 'Dikirim', 'Dalam Pengiriman')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  selected_options JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id) -- One review per user per product
);

-- ============================================
-- 6. RESELLER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reseller_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  store_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. RESELLER CONNECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reseller_connections (
  id BIGSERIAL PRIMARY KEY,
  user_a BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_b BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'pending', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b),
  CHECK (user_a <> user_b) -- Cannot connect to self
);

-- ============================================
-- 8. TELEGRAM USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS telegram_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  chat_id TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_reseller ON products(reseller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_approved ON products(is_approved);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- Reseller profiles indexes
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_user ON reseller_profiles(user_id);

-- Reseller connections indexes
CREATE INDEX IF NOT EXISTS idx_reseller_connections_user_a ON reseller_connections(user_a);
CREATE INDEX IF NOT EXISTS idx_reseller_connections_user_b ON reseller_connections(user_b);

-- Telegram users indexes
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);

-- ============================================
-- 10. DISABLE ROW LEVEL SECURITY (for service key access)
-- ============================================
-- If you want to use service key without RLS policies, run these:

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. ALTERNATIVE: ENABLE RLS WITH SERVICE ROLE POLICIES
-- ============================================
-- If you prefer to keep RLS enabled with policies:
/*
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service role to do everything
CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reseller_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reseller_connections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON telegram_users FOR ALL TO service_role USING (true) WITH CHECK (true);
*/

-- ============================================
-- 12. SEED ADMIN USER (OPTIONAL)
-- ============================================
-- Create default admin user
-- Password: admin123 (hash generated with bcrypt rounds=10)
-- IMPORTANT: Change this password after first login!

INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@billsnack.id',
  '$2b$10$YourBcryptHashHere', -- Generate this with: node -e "console.log(require('bcrypt').hashSync('admin123', 10))"
  'Admin',
  'BillSnack',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 13. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Sample reseller user
INSERT INTO users (email, password_hash, first_name, last_name, role, phone)
VALUES (
  'reseller@example.com',
  '$2b$10$YourBcryptHashHere',
  'John',
  'Reseller',
  'reseller',
  '081234567890'
)
ON CONFLICT (email) DO NOTHING;

-- Get the reseller user_id for next inserts
DO $$
DECLARE
  reseller_user_id BIGINT;
BEGIN
  SELECT id INTO reseller_user_id FROM users WHERE email = 'reseller@example.com';
  
  -- Create reseller profile
  INSERT INTO reseller_profiles (user_id, store_name, phone, address)
  VALUES (
    reseller_user_id,
    'John''s Electronics Store',
    '081234567890',
    'Jl. Contoh No. 123, Jakarta'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Sample product from reseller
  INSERT INTO products (name, description, price, stock, category, images, is_approved, reseller_id, seller_name)
  VALUES (
    'Sample Product',
    'This is a sample product for testing',
    100000,
    50,
    'Electronics',
    '["https://via.placeholder.com/300"]'::jsonb,
    true,
    reseller_user_id,
    'John''s Electronics Store'
  );
END $$;

-- Sample regular product (no reseller)
INSERT INTO products (name, description, price, stock, category, images, is_approved)
VALUES (
  'BillSnack Special Product',
  'Official BillSnack product',
  150000,
  100,
  'Featured',
  '["https://via.placeholder.com/300"]'::jsonb,
  true
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify your setup:

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check users
SELECT id, email, role, created_at FROM users;

-- Check products
SELECT id, name, price, stock, seller_name FROM products;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- DONE!
-- ============================================
-- Your Supabase database is now ready for BillSnack!
-- Next steps:
-- 1. Generate bcrypt hash for admin password
-- 2. Update the admin INSERT statement with real hash
-- 3. Update .env with your SUPABASE_URL and SUPABASE_KEY
-- 4. Run: npm install
-- 5. Run: npm start
-- 6. Test: curl http://localhost:4000/health
