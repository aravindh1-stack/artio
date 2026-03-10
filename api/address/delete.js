import { ensureAddressesTable, getPool, normalizeUserId } from '../_db.js';

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

  try {
    await ensureAddressesTable();
    const db = getPool();
    const ref = db.collection('addresses').doc(addressId);
    const snap = await ref.get();
    const data = snap.data() || {};

    if (!snap.exists || data.user_id !== userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await ref.delete();

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to delete address' });
  }
}
