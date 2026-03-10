/*
  # Performance Optimization - Add Missing Indexes
  
  This migration adds critical indexes to improve query performance for the Store page.
  
  ## New Indexes
  - `idx_products_is_active` - Speeds up filtering by is_active column
  - `idx_products_created_at` - Speeds up sorting by created_at (ORDER BY)
  - `idx_categories_display_order` - Speeds up category sorting
  - Composite index on (is_active, category_id, created_at) for optimal Store queries
*/

-- Add index on is_active for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Add index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Add composite index for the exact query pattern used in Store
-- Covers WHERE is_active = true AND category_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_products_active_category_date 
  ON products(is_active, category_id, created_at DESC)
  WHERE is_active = true;

-- Add index on categories display_order for faster sorting
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Analyze tables to update query planner statistics
ANALYZE products;
ANALYZE categories;
