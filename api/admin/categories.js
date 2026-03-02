import { ensureAdminSchema, getPool } from '../_db.js';

const mapCategory = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || '',
  image_path: row.image_url || row.image_path || '',
  display_order: row.display_order || 0,
});

export default async function handler(req, res) {
  const pool = getPool();

  try {
    await ensureAdminSchema();
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM categories ORDER BY display_order ASC, created_at DESC');
      return res.status(200).json(result.rows.map(mapCategory));
    }

    if (req.method === 'POST') {
      const payload = req.body ?? {};
      const result = await pool.query(
        `INSERT INTO categories (name, slug, description, image_url, display_order)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [payload.name, payload.slug, payload.description || '', payload.image_path || '', payload.display_order || 0]
      );
      return res.status(201).json(mapCategory(result.rows[0]));
    }

    if (req.method === 'PUT') {
      const payload = req.body ?? {};
      if (!payload.id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const result = await pool.query(
        `UPDATE categories
         SET name = $1,
             slug = $2,
             description = $3,
             image_url = $4,
             display_order = $5
         WHERE id = $6
         RETURNING *`,
        [payload.name, payload.slug, payload.description || '', payload.image_path || '', payload.display_order || 0, payload.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }

      return res.status(200).json(mapCategory(result.rows[0]));
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Categories API failed' });
  }
}
