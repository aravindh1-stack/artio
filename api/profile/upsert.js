import { ensureProfileSchema, getPool, normalizeUserId, nowIso, toIso } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId: rawUserId, email, fullName = '', phone = '' } = req.body ?? {};
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  // Prefer email-based identity so a localStorage reset doesn't create a new non-admin profile row.
  const userId = normalizeUserId(normalizedEmail || rawUserId);

  if (!userId || !normalizedEmail) {
    return res.status(400).json({ error: 'userId/email is required' });
  }

  try {
    const db = getPool();
    await ensureProfileSchema();
    const existingByEmailSnap = await db.collection('profiles').where('email', '==', normalizedEmail).limit(10).get();
    const candidates = existingByEmailSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
    candidates.sort((a, b) => {
      const ar = String(a.role || '').toLowerCase() === 'admin' ? 0 : 1;
      const br = String(b.role || '').toLowerCase() === 'admin' ? 0 : 1;
      if (ar !== br) {
        return ar - br;
      }
      return String(toIso(b.updated_at) || '').localeCompare(String(toIso(a.updated_at) || ''));
    });

    if (candidates.length > 0) {
      const existing = candidates[0];
      const next = {
        ...existing,
        full_name: fullName !== '' ? fullName : existing.full_name || '',
        phone: phone !== '' ? phone : existing.phone || '',
        updated_at: nowIso(),
      };
      await db.collection('profiles').doc(existing.id).set(next, { merge: true });
      return res.status(200).json({
        id: existing.id,
        email: next.email || normalizedEmail,
        full_name: next.full_name || '',
        phone: next.phone || '',
        role: next.role || 'user',
      });
    }

    const now = nowIso();
    const profile = {
      id: userId,
      email: normalizedEmail,
      full_name: fullName,
      phone,
      role: 'user',
      created_at: now,
      updated_at: now,
    };
    await db.collection('profiles').doc(userId).set(profile);

    return res.status(200).json({
      id: userId,
      email: normalizedEmail,
      full_name: fullName,
      phone,
      role: 'user',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to upsert profile' });
  }
}
