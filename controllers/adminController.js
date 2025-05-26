const pool = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

/**
 * Admin login route handler with validation
 */
const adminLogin = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const admin = result.rows[0];
      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        token,
        user: {
          id: admin.id,
          email: admin.email,
          role: 'admin'
        }
      });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Admin login error:`, err.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
];

/**
 * Get all registered users
 */
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, is_approved, created_at FROM users ORDER BY created_at DESC"
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Get users error:`, err.message);
    return res.status(500).json({ message: "Failed to retrieve users" });
  }
};

/**
 * Approve or disapprove a user
 */
const approveUser = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { approved } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET is_approved = $1 WHERE id = $2 RETURNING id, username, email, is_approved",
      [approved, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: `User ${approved ? 'approved' : 'disapproved'}`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Approve user error:`, err.message);
    return res.status(500).json({ message: "Failed to update user approval status" });
  }
};

/**
 * Delete a user
 */
const deleteUser = async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Delete user error:`, err.message);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

module.exports = {
  adminLogin,
  getUsers,
  approveUser,
  deleteUser
};
