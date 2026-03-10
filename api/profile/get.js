import { ensureProfileSchema, getPool, normalizeUserId, toIso } from '../_db.js';

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
    const db = getPool();
    await ensureProfileSchema();

    const candidates = [];
    if (userId) {
      const byId = await db.collection('profiles').doc(userId).get();
      if (byId.exists) {
        candidates.push({ id: byId.id, ...(byId.data() || {}) });
      }
    }

    if (email) {
      const byEmail = await db.collection('profiles').where('email', '==', email).limit(10).get();
      byEmail.docs.forEach((doc) => candidates.push({ id: doc.id, ...(doc.data() || {}) }));
    }

    const unique = [...new Map(candidates.map((item) => [item.id, item])).values()];
    unique.sort((a, b) => {
      const ar = String(a.role || '').toLowerCase() === 'admin' ? 0 : 1;
      const br = String(b.role || '').toLowerCase() === 'admin' ? 0 : 1;
      if (ar !== br) {
        return ar - br;
      }
      return String(toIso(b.updated_at) || '').localeCompare(String(toIso(a.updated_at) || ''));
    });

    if (unique.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = unique[0];
    return res.status(200).json({
      id: profile.id,
      email: profile.email || '',
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      role: profile.role || 'user',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
}
