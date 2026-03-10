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

const mapCategory = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || '',
  image_path: normalizeImageValue(row.image_url || row.image_path || ''),
  display_order: row.display_order || 0,
});

export default async function handler(req, res) {
  const db = getPool();

  try {
    await ensureAdminSchema();
    if (req.method === 'GET') {
      const snap = await db.collection('categories').get();
      const rows = snap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
        .sort((a, b) => {
          if ((a.display_order || 0) !== (b.display_order || 0)) {
            return (a.display_order || 0) - (b.display_order || 0);
          }
          return String(toIso(b.created_at) || '').localeCompare(String(toIso(a.created_at) || ''));
        });
      return res.status(200).json(rows.map(mapCategory));
    }

    if (req.method === 'POST') {
      const payload = req.body ?? {};
      const id = payload.id || randomUUID();
      const now = nowIso();
      const row = {
        id,
        name: payload.name || '',
        slug: payload.slug || '',
        description: payload.description || '',
        image_url: normalizeImageValue(payload.image_path || ''),
        display_order: Number(payload.display_order || 0),
        created_at: now,
        updated_at: now,
      };
      await db.collection('categories').doc(id).set(row);
      return res.status(201).json(mapCategory(row));
    }

    if (req.method === 'PUT') {
      const payload = req.body ?? {};
      if (!payload.id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const ref = db.collection('categories').doc(payload.id);
      const existing = await ref.get();
      if (!existing.exists) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const next = {
        ...existing.data(),
        name: payload.name || '',
        slug: payload.slug || '',
        description: payload.description || '',
        image_url: normalizeImageValue(payload.image_path || ''),
        display_order: Number(payload.display_order || 0),
        updated_at: nowIso(),
      };
      await ref.set(next, { merge: true });
      return res.status(200).json(mapCategory({ id: payload.id, ...next }));
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      await db.collection('categories').doc(String(id)).delete();
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Categories API failed' });
  }
}
