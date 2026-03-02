import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

try {
  const tables = await pool.query(
    "select table_schema, table_name from information_schema.tables where table_name in ('profiles','addresses') order by table_schema, table_name"
  );
  console.log('tables', tables.rows);

  const profilesCols = await pool.query(
    "select column_name, data_type from information_schema.columns where table_name = 'profiles' order by ordinal_position"
  );
  console.log('profiles columns', profilesCols.rows);

  const addressesCols = await pool.query(
    "select column_name, data_type from information_schema.columns where table_name = 'addresses' order by ordinal_position"
  );
  console.log('addresses columns', addressesCols.rows);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
