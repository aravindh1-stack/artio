import { randomUUID } from 'crypto';
import { ensureAdminSchema, getPool, nowIso, toIso } from '../_db.js';

const isProbablyRawBase64 = (value) =>
  typeof value === 'string' && value.length > 120 && !value.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(value);

const normalizeImageValue = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  if (isProbablyRawBase64(trimmed)) {
    return `data:image/jpeg;base64,${trimmed}`;
  }

  return trimmed;
};

const mapProduct = (row) => ({
  id: row.id,
  category_id: row.category_id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  price: row.price,
  image_path: normalizeImageValue(row.image_url || row.image_path || ''),
  preview_image_url: row.preview_image_url || '',
  full_image_path: row.full_image_path || '',
  dimensions: row.dimensions || '',
  stock_quantity: row.stock_quantity || 0,
  is_featured: Boolean(row.is_featured),
  is_active: Boolean(row.is_active),
  categories: row.category_name ? { name: row.category_name } : null,
});

export default async function handler(req, res) {
  const db = getPool();

  try {
    await ensureAdminSchema();
    if (req.method === 'GET') {
      const [productsSnap, categoriesSnap] = await Promise.all([
        db.collection('products').get(),
        db.collection('categories').get(),
      ]);

      const categoryById = new Map();
      categoriesSnap.docs.forEach((doc) => {
        const data = doc.data() || {};
        categoryById.set(doc.id, data.name || '');
      });

      const rows = productsSnap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
        .sort((a, b) => String(toIso(b.created_at) || '').localeCompare(String(toIso(a.created_at) || '')))
        .map((row) => ({
          ...row,
          category_name: categoryById.get(row.category_id) || '',
        }));

      return res.status(200).json(rows.map(mapProduct));
    }

    if (req.method === 'POST') {
      const payload = req.body ?? {};
      const id = payload.id || randomUUID();
      const now = nowIso();
      const row = {
        id,
        category_id: payload.category_id || null,
        name: payload.name || '',
        slug: payload.slug || '',
        description: payload.description || '',
        price: Number(payload.price || 0),
        image_url: normalizeImageValue(payload.image_path || payload.image_url || ''),
        preview_image_url: payload.preview_image_url || '',
        full_image_path: payload.full_image_path || '',
        dimensions: payload.dimensions || '',
        stock_quantity: Number(payload.stock_quantity || 0),
        is_featured: Boolean(payload.is_featured),
        is_active: payload.is_active !== false,
        created_at: now,
        updated_at: now,
      };

      await db.collection('products').doc(id).set(row);
      return res.status(201).json(mapProduct(row));
    }

    if (req.method === 'PUT') {
      const payload = req.body ?? {};
      if (!payload.id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const ref = db.collection('products').doc(payload.id);
      const existing = await ref.get();
      if (!existing.exists) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const next = {
        ...existing.data(),
        category_id: payload.category_id || null,
        name: payload.name || '',
        slug: payload.slug || '',
        description: payload.description || '',
        price: Number(payload.price || 0),
        image_url: normalizeImageValue(payload.image_path || payload.image_url || ''),
        preview_image_url: payload.preview_image_url || '',
        full_image_path: payload.full_image_path || '',
        dimensions: payload.dimensions || '',
        stock_quantity: Number(payload.stock_quantity || 0),
        is_featured: Boolean(payload.is_featured),
        is_active: payload.is_active !== false,
        updated_at: nowIso(),
      };

      await ref.set(next, { merge: true });
      return res.status(200).json(mapProduct({ id: payload.id, ...next }));
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      await db.collection('products').doc(String(id)).delete();
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Products API failed' });
  }
}
