import { ensureAdminSchema, ensureProfileSchema, getPool, normalizeUserId, nowIso, toIso } from '../_db.js';

export default async function handler(req, res) {
  const db = getPool();

  try {
    await ensureAdminSchema();
    await ensureProfileSchema();
    if (req.method === 'GET') {
      const snap = await db.collection('profiles').get();
      const rows = snap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
        .sort((a, b) => String(toIso(b.created_at) || '').localeCompare(String(toIso(a.created_at) || '')))
        .map((row) => ({
          id: row.id,
          email: row.email || '',
          full_name: row.full_name || '',
          phone: row.phone || '',
          role: row.role || 'user',
          created_at: toIso(row.created_at),
        }));
      return res.status(200).json(rows);
    }

    if (req.method === 'PATCH') {
      const { userId: rawUserId, role } = req.body ?? {};
      const userId = normalizeUserId(rawUserId);
      if (!userId || !role) {
        return res.status(400).json({ error: 'userId and role are required' });
      }

      const ref = db.collection('profiles').doc(userId);
      const snap = await ref.get();
      if (!snap.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const current = snap.data() || {};
      const next = {
        ...current,
        role,
        updated_at: nowIso(),
      };
      await ref.set(next, { merge: true });

      return res.status(200).json({
        id: userId,
        email: next.email || '',
        full_name: next.full_name || '',
        phone: next.phone || '',
        role: next.role || 'user',
      });
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Users API failed' });
  }
}
