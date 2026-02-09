-- Add preview and secure asset fields
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS preview_image_url text,
  ADD COLUMN IF NOT EXISTS full_image_path text;

-- Add payment status to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- Index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON orders(payment_status);
