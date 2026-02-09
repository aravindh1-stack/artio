-- Add Stripe price ID support for secure checkout
ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_price_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_stripe_price_id
  ON products(stripe_price_id);
