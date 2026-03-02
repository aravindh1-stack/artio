import { ensureAdminSchema, getPool, normalizeUserId } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId: rawUserId, items = [], shippingAddress, totalAmount } = req.body ?? {};
  const userId = normalizeUserId(rawUserId);

  if (!userId || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
    return res.status(400).json({ error: 'Invalid checkout payload' });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await ensureAdminSchema();
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, payment_status, total_amount, shipping_address, updated_at)
       VALUES ($1, 'pending', 'unpaid', $2, $3::jsonb, now())
       RETURNING id, user_id, status, payment_status, total_amount, shipping_address, created_at`,
      [userId, totalAmount, JSON.stringify(shippingAddress)]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.id, item.quantity, item.price]
      );

      await client.query(
        `UPDATE products
         SET stock_quantity = GREATEST(stock_quantity - $1, 0),
             updated_at = now()
         WHERE id = $2`,
        [item.quantity, item.id]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: error.message || 'Checkout failed' });
  } finally {
    client.release();
  }
}
