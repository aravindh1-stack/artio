import { ensureAddressesTable, getPool, normalizeUserId } from '../_db.js';
import { nowIso } from '../_db.js';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    userId: rawUserId,
    addressId,
    fullName,
    phone,
    line1,
    line2,
    city,
    state,
    postalCode,
    country,
    isDefault,
  } = req.body ?? {};

  const userId = normalizeUserId(rawUserId);

  if (!userId || !fullName || !phone || !line1 || !city || !state || !postalCode || !country) {
    return res.status(400).json({ error: 'Missing required address fields' });
  }

  await ensureAddressesTable();
  const db = getPool();

  try {
    const now = nowIso();

    if (isDefault) {
      const existing = await db.collection('addresses').where('user_id', '==', userId).get();
      await Promise.all(existing.docs.map((doc) => doc.ref.set({ is_default: false, updated_at: now }, { merge: true })));
    }

    let result;
    if (addressId) {
      const ref = db.collection('addresses').doc(addressId);
      const snap = await ref.get();
      const current = snap.data() || {};
      if (!snap.exists || current.user_id !== userId) {
        return res.status(404).json({ error: 'Address not found' });
      }

      result = {
        ...current,
        id: addressId,
        full_name: fullName,
        phone,
        address_line1: line1,
        address_line2: line2 ?? '',
        city,
        state,
        postal_code: postalCode,
        country,
        is_default: Boolean(isDefault),
        updated_at: now,
      };
      await ref.set(result, { merge: true });
    } else {
      const id = randomUUID();
      result = {
        id,
        user_id: userId,
        full_name: fullName,
        phone,
        address_line1: line1,
        address_line2: line2 ?? '',
        city,
        state,
        postal_code: postalCode,
        country,
        is_default: Boolean(isDefault),
        created_at: now,
        updated_at: now,
      };
      await db.collection('addresses').doc(id).set(result);
    }

    return res.status(addressId ? 200 : 201).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to save address' });
  }
}
