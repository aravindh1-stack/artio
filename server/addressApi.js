import express from 'express';
import { pool } from './db.js';
const router = express.Router();

// Save address
router.post('/save', async (req, res) => {
  const { userId, fullName, phone, line1, line2, city, state, postalCode, country, isDefault } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO addresses (user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [userId, fullName, phone, line1, line2, city, state, postalCode, country, isDefault]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save address' });
  }
});

export default router;
