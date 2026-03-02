import { getPool } from '../_db.js';

const mapProduct = (row) => ({
  id: row.id,
  category_id: row.category_id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  price: row.price,
  image_path: row.image_url || '',
  preview_image_url: row.preview_image_url || '',
  full_image_path: row.full_image_path || '',
  dimensions: row.dimensions || '',
  stock_quantity: row.stock_quantity || 0,
  is_featured: Boolean(row.is_featured),
  is_active: Boolean(row.is_active),
  categories: row.category_name ? { name: row.category_name } : null,
});

export default async function handler(req, res) {
  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const result = await pool.query(
        `SELECT p.*, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         ORDER BY p.created_at DESC`
      );
      return res.status(200).json(result.rows.map(mapProduct));
    }

    if (req.method === 'POST') {
      const payload = req.body ?? {};
      const result = await pool.query(
        `INSERT INTO products (
          category_id, name, slug, description, price, image_url,
          preview_image_url, full_image_path, dimensions, stock_quantity,
          is_featured, is_active, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now())
        RETURNING *`,
        [
          payload.category_id || null,
          payload.name,
          payload.slug,
          payload.description || '',
          payload.price || 0,
          payload.image_path || payload.image_url || '',
          payload.preview_image_url || '',
          payload.full_image_path || '',
          payload.dimensions || '',
          payload.stock_quantity || 0,
          Boolean(payload.is_featured),
          payload.is_active !== false,
        ]
      );
      return res.status(201).json(mapProduct(result.rows[0]));
    }

    if (req.method === 'PUT') {
      const payload = req.body ?? {};
      if (!payload.id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const result = await pool.query(
        `UPDATE products
         SET category_id = $1,
             name = $2,
             slug = $3,
             description = $4,
             price = $5,
             image_url = $6,
             preview_image_url = $7,
             full_image_path = $8,
             dimensions = $9,
             stock_quantity = $10,
             is_featured = $11,
             is_active = $12,
             updated_at = now()
         WHERE id = $13
         RETURNING *`,
        [
          payload.category_id || null,
          payload.name,
          payload.slug,
          payload.description || '',
          payload.price || 0,
          payload.image_path || payload.image_url || '',
          payload.preview_image_url || '',
          payload.full_image_path || '',
          payload.dimensions || '',
          payload.stock_quantity || 0,
          Boolean(payload.is_featured),
          payload.is_active !== false,
          payload.id,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.status(200).json(mapProduct(result.rows[0]));
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Products API failed' });
  }
}
