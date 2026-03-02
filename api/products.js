import { ensureAdminSchema, getPool } from './_db.js';

const mapProduct = (row) => ({
  id: row.id,
  category_id: row.category_id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  price: row.price,
  image_path: row.image_url || row.image_path || '',
  preview_image_url: row.preview_image_url || '',
  full_image_path: row.full_image_path || '',
  dimensions: row.dimensions || '',
  stock_quantity: row.stock_quantity || 0,
  is_featured: Boolean(row.is_featured),
  is_active: Boolean(row.is_active),
  categories: row.category_name ? { name: row.category_name, slug: row.category_slug } : null,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureAdminSchema();
    const pool = getPool();
    const categoryId = req.query.categoryId;

    const query = categoryId
      ? `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.is_active = true AND p.category_id = $1
         ORDER BY p.created_at DESC`
      : `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.is_active = true
         ORDER BY p.created_at DESC`;

    const result = categoryId
      ? await pool.query(query, [categoryId])
      : await pool.query(query);

    return res.status(200).json(result.rows.map(mapProduct));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load products' });
  }
}
