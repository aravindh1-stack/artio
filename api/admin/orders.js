import { randomUUID } from 'crypto';
import { ensureAdminSchema, getPool, normalizeUserId, nowIso, toIso } from '../_db.js';

const createArtioOrderId = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const stamp = `${y}${m}${d}`;
  const token = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `ARTIO-${stamp}-${token}`;
};

export default async function handler(req, res) {
  const db = getPool();

  try {
    await ensureAdminSchema();
    if (req.method === 'GET') {
      const userId = normalizeUserId(req.query.userId);

      const productsSnap = await db.collection('products').get();
      const productById = new Map(
        productsSnap.docs.map((doc) => {
          const p = doc.data() || {};
          return [doc.id, { id: doc.id, name: p.name || '', image_path: p.image_url || p.image_path || '' }];
        })
      );

      const ordersSnap = userId
        ? await db.collection('orders').where('user_id', '==', userId).get()
        : await db.collection('orders').get();

      const orders = ordersSnap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
        .sort((a, b) => String(toIso(b.created_at) || '').localeCompare(String(toIso(a.created_at) || '')))
        .map((order) => {
          const items = Array.isArray(order.order_items) ? order.order_items : [];
          return {
            id: order.id,
            user_id: order.user_id,
            status: order.status || 'pending',
            payment_status: order.payment_status || 'unpaid',
            total_amount: Number(order.total_amount || 0),
            shipping_address: order.shipping_address || null,
            created_at: toIso(order.created_at),
            order_items: items.map((item, index) => ({
              id: item.id || `${order.id}-${index + 1}`,
              order_id: order.id,
              quantity: Number(item.quantity || 0),
              price_at_purchase: Number(item.price_at_purchase || 0),
              products: {
                id: item.product_id,
                name: productById.get(item.product_id)?.name || item.product_name || '',
                image_path: productById.get(item.product_id)?.image_path || item.product_image_url || '',
              },
            })),
          };
        });

      return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
      const { userId: rawUserId, items = [], shippingAddress, totalAmount } = req.body ?? {};
      const userId = normalizeUserId(rawUserId);

      if (!userId || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
        return res.status(400).json({ error: 'Invalid checkout payload' });
      }

      try {
        const orderId = createArtioOrderId();
        const now = nowIso();
        const orderItems = items.map((item) => ({
          id: randomUUID(),
          product_id: item.id,
          quantity: Number(item.quantity || 0),
          price_at_purchase: Number(item.price || 0),
          product_name: item.name || '',
          product_image_url: item.image_path || item.image_url || '',
        }));

        await db.runTransaction(async (tx) => {
          for (const item of orderItems) {
            const productRef = db.collection('products').doc(item.product_id);
            const productSnap = await tx.get(productRef);
            if (!productSnap.exists) {
              throw new Error(`Product not found: ${item.product_id}`);
            }

            const product = productSnap.data() || {};
            const nextStock = Math.max(Number(product.stock_quantity || 0) - Number(item.quantity || 0), 0);
            tx.set(productRef, { stock_quantity: nextStock, updated_at: now }, { merge: true });
          }

          tx.set(db.collection('orders').doc(orderId), {
            id: orderId,
            user_id: userId,
            status: 'pending',
            payment_status: 'unpaid',
            total_amount: Number(totalAmount || 0),
            shipping_address: shippingAddress,
            order_items: orderItems,
            created_at: now,
            updated_at: now,
          });
        });

        return res.status(201).json({
          id: orderId,
          user_id: userId,
          status: 'pending',
          payment_status: 'unpaid',
          total_amount: Number(totalAmount || 0),
          shipping_address: shippingAddress,
          created_at: now,
        });
      } catch (error) {
        return res.status(500).json({ error: error.message || 'Checkout failed' });
      }
    }

    if (req.method === 'PATCH') {
      const { orderId, status, payment_status } = req.body ?? {};
      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }

      const ref = db.collection('orders').doc(orderId);
      const snap = await ref.get();
      if (!snap.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const current = snap.data() || {};
      const nextStatus = status ?? current.status;
      const nextPaymentStatus = payment_status ?? current.payment_status;

      const updated = {
        ...current,
        status: nextStatus,
        payment_status: nextPaymentStatus,
        updated_at: nowIso(),
      };
      await ref.set(updated, { merge: true });

      return res.status(200).json({
        id: orderId,
        user_id: updated.user_id,
        status: updated.status,
        payment_status: updated.payment_status,
        total_amount: Number(updated.total_amount || 0),
        shipping_address: updated.shipping_address || null,
        created_at: toIso(updated.created_at),
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Orders API failed' });
  }
}
