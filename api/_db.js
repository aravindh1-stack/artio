import pg from 'pg';
import { createHash } from 'crypto';

const { Pool } = pg;

let pool;
let addressesTableReady = false;
let adminSchemaReady = false;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

export function normalizeUserId(userId) {
  const rawValue = String(userId ?? '').trim().toLowerCase();
  if (!rawValue) {
    return '';
  }

  if (uuidRegex.test(rawValue)) {
    return rawValue;
  }

  const hash = createHash('sha256').update(rawValue).digest('hex');
  const version = `4${hash.slice(13, 16)}`;
  const variantNibble = ['8', '9', 'a', 'b'][parseInt(hash[16], 16) % 4];
  const variant = `${variantNibble}${hash.slice(17, 20)}`;
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${version}-${variant}-${hash.slice(20, 32)}`;
}

export async function ensureAddressesTable() {
  if (addressesTableReady) {
    return;
  }

  const currentPool = getPool();
  await currentPool.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      full_name text NOT NULL DEFAULT '',
      phone text NOT NULL DEFAULT '',
      address_line1 text NOT NULL DEFAULT '',
      address_line2 text DEFAULT '',
      city text NOT NULL DEFAULT '',
      state text NOT NULL DEFAULT '',
      postal_code text NOT NULL DEFAULT '',
      country text NOT NULL DEFAULT '',
      is_default boolean NOT NULL DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `);
  await currentPool.query('CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id)');
  await currentPool.query('CREATE INDEX IF NOT EXISTS idx_addresses_user_default ON addresses(user_id, is_default)');
  addressesTableReady = true;
}

export async function ensureAdminSchema() {
  if (adminSchemaReady) {
    return;
  }

  const currentPool = getPool();
  await currentPool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS image_url text DEFAULT '',
      ADD COLUMN IF NOT EXISTS image_path text DEFAULT '',
      ADD COLUMN IF NOT EXISTS preview_image_url text DEFAULT '',
      ADD COLUMN IF NOT EXISTS full_image_path text DEFAULT ''
  `);
  await currentPool.query(`
    ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS image_url text DEFAULT '',
      ADD COLUMN IF NOT EXISTS image_path text DEFAULT ''
  `);
  await currentPool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid'
  `);

  adminSchemaReady = true;
}
