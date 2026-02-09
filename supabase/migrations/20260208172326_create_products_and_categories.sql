/*
  # Artio Redefined Gallery - E-commerce Database Schema

  ## Overview
  Complete database structure for the premium gallery e-commerce platform including
  products, categories, user orders, and cart functionality.

  ## New Tables

  ### 1. `categories`
  Product categorization for organizing gallery items
  - `id` (uuid, primary key) - Unique category identifier
  - `name` (text) - Category name (e.g., "Abstract", "Nature", "Architecture")
  - `slug` (text, unique) - URL-friendly version of name
  - `description` (text) - Category description
  - `image_url` (text) - Category thumbnail image
  - `display_order` (integer) - Order for displaying categories
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. `products`
  Premium posters and art pieces for sale
  - `id` (uuid, primary key) - Unique product identifier
  - `category_id` (uuid, foreign key) - References categories table
  - `name` (text) - Product name
  - `slug` (text, unique) - URL-friendly version of name
  - `description` (text) - Product description
  - `price` (decimal) - Product price in USD
  - `image_url` (text) - Primary product image
  - `images` (jsonb) - Array of additional product images
  - `dimensions` (text) - Physical dimensions (e.g., "24x36 inches")
  - `stock_quantity` (integer) - Available inventory
  - `is_featured` (boolean) - Whether to feature on homepage
  - `is_active` (boolean) - Whether product is available for purchase
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `orders`
  Customer purchase orders
  - `id` (uuid, primary key) - Unique order identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `status` (text) - Order status (pending, processing, completed, cancelled)
  - `total_amount` (decimal) - Total order amount
  - `shipping_address` (jsonb) - Shipping address details
  - `payment_intent_id` (text) - Stripe payment intent ID
  - `created_at` (timestamptz) - Order creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `order_items`
  Individual items within orders
  - `id` (uuid, primary key) - Unique item identifier
  - `order_id` (uuid, foreign key) - References orders table
  - `product_id` (uuid, foreign key) - References products table
  - `quantity` (integer) - Quantity ordered
  - `price_at_purchase` (decimal) - Price at time of purchase
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Categories and products are publicly readable
  - Orders are only accessible by the user who created them
  - Only authenticated users can create orders

  ## Indexes
  - Index on product category_id for faster filtering
  - Index on order user_id for faster user order queries
  - Index on product slug for faster lookups
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  price decimal(10, 2) NOT NULL,
  image_url text NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  dimensions text DEFAULT '',
  stock_quantity integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  total_amount decimal(10, 2) NOT NULL,
  shipping_address jsonb DEFAULT '{}'::jsonb,
  payment_intent_id text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price_at_purchase decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read access)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

-- RLS Policies for products (public read access for active products)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO public
  USING (is_active = true);

-- RLS Policies for orders (users can only see their own orders)
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for order_items (accessible through orders)
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url, display_order) VALUES
  ('Abstract Art', 'abstract-art', 'Modern abstract designs that push boundaries', 'https://images.pexels.com/photos/1269968/pexels-photo-1269968.jpeg?auto=compress&cs=tinysrgb&w=800', 1),
  ('Nature & Landscape', 'nature-landscape', 'Breathtaking natural scenery and landscapes', 'https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg?auto=compress&cs=tinysrgb&w=800', 2),
  ('Architecture', 'architecture', 'Stunning architectural photography and designs', 'https://images.pexels.com/photos/290595/pexels-photo-290595.jpeg?auto=compress&cs=tinysrgb&w=800', 3),
  ('Minimalist', 'minimalist', 'Clean, simple, and elegant minimal designs', 'https://images.pexels.com/photos/1279813/pexels-photo-1279813.jpeg?auto=compress&cs=tinysrgb&w=800', 4),
  ('Urban Photography', 'urban-photography', 'Captivating urban and street photography', 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800', 5),
  ('Black & White', 'black-white', 'Timeless monochrome photography', 'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=800', 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (category_id, name, slug, description, price, image_url, images, dimensions, stock_quantity, is_featured, is_active) VALUES
  (
    (SELECT id FROM categories WHERE slug = 'abstract-art'),
    'Ethereal Waves',
    'ethereal-waves',
    'A mesmerizing abstract composition featuring flowing waves of color that evoke a sense of movement and fluidity. Perfect for modern spaces.',
    149.99,
    'https://images.pexels.com/photos/1269968/pexels-photo-1269968.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '["https://images.pexels.com/photos/1269968/pexels-photo-1269968.jpeg?auto=compress&cs=tinysrgb&w=1200"]'::jsonb,
    '24x36 inches',
    25,
    true,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'nature-landscape'),
    'Mountain Majesty',
    'mountain-majesty',
    'Capture the grandeur of towering peaks with this stunning landscape photograph. A testament to nature''s raw beauty.',
    179.99,
    'https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '["https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg?auto=compress&cs=tinysrgb&w=1200"]'::jsonb,
    '30x40 inches',
    15,
    true,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'architecture'),
    'Geometric Harmony',
    'geometric-harmony',
    'Modern architectural photography showcasing the interplay of light, shadow, and geometric forms in contemporary design.',
    159.99,
    'https://images.pexels.com/photos/290595/pexels-photo-290595.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '["https://images.pexels.com/photos/290595/pexels-photo-290595.jpeg?auto=compress&cs=tinysrgb&w=1200"]'::jsonb,
    '24x36 inches',
    20,
    true,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'minimalist'),
    'Serene Simplicity',
    'serene-simplicity',
    'Embracing the beauty of less. A minimalist composition that speaks volumes through its restraint and elegance.',
    129.99,
    'https://images.pexels.com/photos/1279813/pexels-photo-1279813.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '["https://images.pexels.com/photos/1279813/pexels-photo-1279813.jpeg?auto=compress&cs=tinysrgb&w=1200"]'::jsonb,
    '20x30 inches',
    30,
    false,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'urban-photography'),
    'City Lights',
    'city-lights',
    'The vibrant energy of urban life captured in a single frame. Perfect for adding metropolitan sophistication to any space.',
    169.99,
    'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '["https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1200"]'::jsonb,
    '24x36 inches',
    18,
    true,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'black-white'),
    'Timeless Contrast',
    'timeless-contrast',
    'A powerful black and white composition that transcends time. Classic monochrome photography at its finest.',
    139.99,
    'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '["https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=1200"]'::jsonb,
    '20x30 inches',
    22,
    false,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'abstract-art'),
    'Color Symphony',
    'color-symphony',
    'An explosion of vibrant colors harmoniously arranged in an abstract dance. Brings energy and life to any room.',
    189.99,
    'https://images.pexels.com/photos/1988681/pexels-photo-1988681.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '["https://images.pexels.com/photos/1988681/pexels-photo-1988681.jpeg?auto=compress&cs=tinysrgb&w=1200"]'::jsonb,
    '30x40 inches',
    12,
    false,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'nature-landscape'),
    'Forest Whispers',
    'forest-whispers',
    'Immerse yourself in the tranquility of ancient forests. A serene landscape that brings nature indoors.',
    159.99,
    'https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '["https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg?auto=compress&cs=tinysrgb&w=1200"]'::jsonb,
    '24x36 inches',
    20,
    false,
    true
  )
ON CONFLICT (slug) DO NOTHING;