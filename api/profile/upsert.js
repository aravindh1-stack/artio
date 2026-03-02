import { getPool, normalizeUserId } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId: rawUserId, email, fullName = '', phone = '' } = req.body ?? {};
  const userId = normalizeUserId(rawUserId || email);

  if (!userId || !email) {
    return res.status(400).json({ error: 'userId/email is required' });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO profiles (id, email, full_name, phone, role, updated_at)
       VALUES ($1, $2, $3, $4, 'user', now())
       ON CONFLICT (id)
       DO UPDATE SET
         email = EXCLUDED.email,
         full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
         phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE profiles.phone END,
         updated_at = now()
       RETURNING id, email, full_name, phone, role`,
      [userId, email, fullName, phone]
    );

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to upsert profile' });
  }
}
