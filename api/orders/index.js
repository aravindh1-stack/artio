import { ensureAdminSchema, getPool, normalizeUserId } from '../_db.js';

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
    await ensureAdminSchema();
    const pool = getPool();

    const ordersResult = await pool.query(
      `SELECT id, user_id, status, payment_status, total_amount, shipping_address, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const orderIds = ordersResult.rows.map((row) => row.id);
    if (orderIds.length === 0) {
      return res.status(200).json([]);
    }

    const itemsResult = await pool.query(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase,
              p.name AS product_name, COALESCE(p.image_url, p.image_path, '') AS product_image
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ANY($1::uuid[])
       ORDER BY oi.created_at ASC`,
      [orderIds]
    );

    const itemsByOrder = itemsResult.rows.reduce((acc, row) => {
      if (!acc[row.order_id]) {
        acc[row.order_id] = [];
      }
      acc[row.order_id].push({
        id: row.id,
        product_id: row.product_id,
        quantity: row.quantity,
        price_at_purchase: row.price_at_purchase,
        products: {
          name: row.product_name,
          image_path: row.product_image,
        },
      });
      return acc;
    }, {});

    const payload = ordersResult.rows.map((order) => ({
      ...order,
      order_items: itemsByOrder[order.id] || [],
    }));

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load orders' });
  }
}
