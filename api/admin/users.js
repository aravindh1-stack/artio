import { ensureAdminSchema, getPool, normalizeUserId } from '../_db.js';

export default async function handler(req, res) {
  const pool = getPool();

  try {
    await ensureAdminSchema();
    if (req.method === 'GET') {
      const result = await pool.query(
        `SELECT id, email, full_name, phone, role, created_at
         FROM profiles
         ORDER BY created_at DESC`
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === 'PATCH') {
      const { userId: rawUserId, role } = req.body ?? {};
      const userId = normalizeUserId(rawUserId);
      if (!userId || !role) {
        return res.status(400).json({ error: 'userId and role are required' });
      }

      const result = await pool.query(
        `UPDATE profiles
         SET role = $1,
             updated_at = now()
         WHERE id = $2
         RETURNING id, email, full_name, phone, role`,
        [role, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Users API failed' });
  }
}
