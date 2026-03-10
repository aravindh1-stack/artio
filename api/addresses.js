import { ensureAddressesTable, getPool, normalizeUserId, toIso } from './_db.js';

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
    const db = getPool();
    const snap = await db.collection('addresses').where('user_id', '==', userId).get();
    const rows = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
      .sort((a, b) => {
        if (Boolean(a.is_default) !== Boolean(b.is_default)) {
          return Boolean(b.is_default) ? 1 : -1;
        }
        return String(toIso(b.created_at) || '').localeCompare(String(toIso(a.created_at) || ''));
      })
      .map((row) => ({
        ...row,
        created_at: toIso(row.created_at),
      }));

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load addresses' });
  }
}
