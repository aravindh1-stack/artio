import { getPool, normalizeUserId } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawUserId = req.query.userId;
  const email = String(req.query.email ?? '').trim().toLowerCase();
  const userId = normalizeUserId(rawUserId || email);

  if (!userId && !email) {
    return res.status(400).json({ error: 'userId or email is required' });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, email, full_name, phone, role
       FROM profiles
       WHERE id = $1 OR email = $2
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 1`,
      [userId, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
}
