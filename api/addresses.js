import { ensureAddressesTable, getPool, normalizeUserId } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = normalizeUserId(req.query.userId);
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    await ensureAddressesTable();
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default, created_at
       FROM addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load addresses' });
  }
}
