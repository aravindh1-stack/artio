import { ensureAdminSchema, getPool, normalizeUserId } from '../_db.js';

export default async function handler(req, res) {
  const pool = getPool();

  try {
    await ensureAdminSchema();
    if (req.method === 'GET') {
      const userId = normalizeUserId(req.query.userId);

      const ordersResult = await pool.query(
        userId
          ? `SELECT id, user_id, status, payment_status, total_amount, shipping_address, created_at
             FROM orders
             WHERE user_id = $1
             ORDER BY created_at DESC`
          : `SELECT id, user_id, status, payment_status, total_amount, shipping_address, created_at
             FROM orders
             ORDER BY created_at DESC`,
        userId ? [userId] : []
      );

      const itemsResult = await pool.query(
        `SELECT oi.id, oi.order_id, oi.quantity, oi.price_at_purchase,
          p.id AS product_id, p.name AS product_name,
          COALESCE(p.image_url, p.image_path, '') AS product_image_url
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id`
      );

      const itemsByOrder = itemsResult.rows.reduce((acc, row) => {
        if (!acc[row.order_id]) {
          acc[row.order_id] = [];
        }
        acc[row.order_id].push({
          id: row.id,
          order_id: row.order_id,
          quantity: row.quantity,
          price_at_purchase: row.price_at_purchase,
          products: {
            id: row.product_id,
            name: row.product_name,
            image_path: row.product_image_url,
          },
        });
        return acc;
      }, {});

      const orders = ordersResult.rows.map((order) => ({
        ...order,
        order_items: itemsByOrder[order.id] || [],
      }));

      return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
      const { userId: rawUserId, items = [], shippingAddress, totalAmount } = req.body ?? {};
      const userId = normalizeUserId(rawUserId);

      if (!userId || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
        return res.status(400).json({ error: 'Invalid checkout payload' });
      }

      const client = await pool.connect();
      try {
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

    if (req.method === 'PATCH') {
      const { orderId, status, payment_status } = req.body ?? {};
      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }

      const current = await pool.query('SELECT id, status, payment_status FROM orders WHERE id = $1', [orderId]);
      if (current.rowCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const nextStatus = status ?? current.rows[0].status;
      const nextPaymentStatus = payment_status ?? current.rows[0].payment_status;

      const result = await pool.query(
        `UPDATE orders
         SET status = $1,
             payment_status = $2,
             updated_at = now()
         WHERE id = $3
         RETURNING id, user_id, status, payment_status, total_amount, shipping_address, created_at`,
        [nextStatus, nextPaymentStatus, orderId]
      );

      return res.status(200).json(result.rows[0]);
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Orders API failed' });
  }
}
