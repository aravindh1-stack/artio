// ...existing code...
const app = express();
app.use(express.json());

import express from 'express';
import { pool } from './db.js';
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE is_active = true');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Add a product
app.post('/api/products', async (req, res) => {
  const { name, description, price, image_path, stock_quantity, dimensions, is_active, category_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, image_path, stock_quantity, dimensions, is_active, category_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, description, price, image_path, stock_quantity, dimensions, is_active, category_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Add a category
app.post('/api/categories', async (req, res) => {
  const { name, slug, description, image_path, display_order } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, slug, description, image_path, display_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, slug, description, image_path, display_order]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add category' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
