import pg from 'pg';

const { Pool } = pg;

let pool;
let addressesTableReady = false;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
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
