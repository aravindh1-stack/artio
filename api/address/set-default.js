import { ensureAddressesTable, getPool } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, addressId } = req.body ?? {};
  if (!userId || !addressId) {
    return res.status(400).json({ error: 'userId and addressId are required' });
  }

  await ensureAddressesTable();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('UPDATE addresses SET is_default = false, updated_at = now() WHERE user_id = $1', [userId]);
    const result = await client.query(
      `UPDATE addresses
       SET is_default = true, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [addressId, userId]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Address not found' });
    }

    await client.query('COMMIT');
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: error.message || 'Failed to set default address' });
  } finally {
    client.release();
  }
}
