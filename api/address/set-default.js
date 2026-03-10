import { ensureAddressesTable, getPool, normalizeUserId, nowIso } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId: rawUserId, addressId } = req.body ?? {};
  const userId = normalizeUserId(rawUserId);
  if (!userId || !addressId) {
    return res.status(400).json({ error: 'userId and addressId are required' });
  }

  await ensureAddressesTable();
  const db = getPool();

  try {
    const now = nowIso();
    const userAddresses = await db.collection('addresses').where('user_id', '==', userId).get();
    await Promise.all(userAddresses.docs.map((doc) => doc.ref.set({ is_default: false, updated_at: now }, { merge: true })));

    const targetRef = db.collection('addresses').doc(addressId);
    const targetSnap = await targetRef.get();
    const target = targetSnap.data() || {};
    if (!targetSnap.exists || target.user_id !== userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const updated = { ...target, id: addressId, is_default: true, updated_at: now };
    await targetRef.set(updated, { merge: true });
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to set default address' });
  }
}
