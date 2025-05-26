const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const pool = require('../db');
require('dotenv').config();

const SALT_ROUNDS = 10;
const SECRET_KEY = process.env.JWT_SECRET;
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// Rate limiter to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

// Test DB Connection (optional, keep for startup)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to DB at', res.rows[0].now);
  }
});

// Helper function for sending JSON errors
const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
};

// ----------------------- LOGIN -----------------------
router.post(
  '/login',
  authLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password of min 6 chars is required'),
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    const { email, password } = req.body;

    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.is_approved) {
        return res.status(403).json({ message: 'Your account is not yet approved by the admin.' });
      }

      const token = jwt.sign(
        {
          id: user.id,           // Use id for identification
          email: user.email,
          role: 'user',
          isApproved: user.is_approved,
        },
        SECRET_KEY,
        { expiresIn: TOKEN_EXPIRES_IN }
      );

      res.json({
        token,
        approved: user.is_approved,
        username: user.username,
      });
    } catch (err) {
      console.error('Login Error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ----------------------- SIGNUP -----------------------
router.post(
  '/signup',
  authLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    const { email, password, username } = req.body;

    try {
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      await pool.query(
        'INSERT INTO users (email, password, username, is_approved) VALUES ($1, $2, $3, $4)',
        [email, hashedPassword, username, false]
      );

      res.status(201).json({
        message: 'Signup successful. You will be able to login only if the admin approves.',
      });
    } catch (error) {
      console.error('Signup Error:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// ----------------------- FORGOT PASSWORD -----------------------
router.post(
  '/forgot-password',
  authLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    const { email } = req.body;

    try {
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
        [token, expiry, email]
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

      // Create transporter securely
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"No Reply" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset',
        html: `
          <p>You requested a password reset.</p>
          <p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>
        `,
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: 'Password reset email sent.' });
    } catch (err) {
      console.error('Forgot Password Error:', err.message);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
);

// ----------------------- RESET PASSWORD -----------------------
router.post(
  '/reset-password/:token',
  authLimiter,
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    const { token } = req.params;
    const { password } = req.body;

    try {
      const userResult = await pool.query(
        'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
        [token]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      await pool.query(
        'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = $2',
        [hashedPassword, token]
      );

      res.json({ message: 'Password reset successful' });
    } catch (err) {
      console.error('Reset Password Error:', err.message);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
);



router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

module.exports = router;























