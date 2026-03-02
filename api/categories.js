import { ensureAdminSchema, getPool } from './_db.js';

const mapCategory = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || '',
  image_path: row.image_url || row.image_path || '',
  display_order: row.display_order || 0,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureAdminSchema();
    const pool = getPool();
    const result = await pool.query('SELECT * FROM categories ORDER BY display_order ASC, created_at DESC');
    return res.status(200).json(result.rows.map(mapCategory));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load categories' });
  }
}
