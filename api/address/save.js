import { getPool } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    userId,
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

  if (!userId || !fullName || !phone || !line1 || !city || !state || !postalCode || !country) {
    return res.status(400).json({ error: 'Missing required address fields' });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (isDefault) {
      await client.query('UPDATE addresses SET is_default = false, updated_at = now() WHERE user_id = $1', [userId]);
    }

    let result;
    if (addressId) {
      result = await client.query(
        `UPDATE addresses
         SET full_name = $1,
             phone = $2,
             address_line1 = $3,
             address_line2 = $4,
             city = $5,
             state = $6,
             postal_code = $7,
             country = $8,
             is_default = $9,
             updated_at = now()
         WHERE id = $10 AND user_id = $11
         RETURNING *`,
        [
          fullName,
          phone,
          line1,
          line2 ?? '',
          city,
          state,
          postalCode,
          country,
          Boolean(isDefault),
          addressId,
          userId,
        ]
      );

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Address not found' });
      }
    } else {
      result = await client.query(
        `INSERT INTO addresses (user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          fullName,
          phone,
          line1,
          line2 ?? '',
          city,
          state,
          postalCode,
          country,
          Boolean(isDefault),
        ]
      );
    }

    await client.query('COMMIT');
    return res.status(addressId ? 200 : 201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Failed to save address' });
  } finally {
    client.release();
  }
}
