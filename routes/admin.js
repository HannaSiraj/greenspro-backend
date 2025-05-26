const express = require('express');
const router = express.Router();
const { adminLogin, getUsers, approveUser, deleteUser } = require('../controllers/adminController');
const loginLimiter = require('../middleware/loginLimiter');
const verifyToken = require('../middleware/verifyToken');

// Middleware to restrict access to admin only
function adminOnly(req, res, next) {
  console.log('Decoded user from token:', req.user);
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
}

// Routes are relative because mounted on '/api/admin' in server.js
router.post('/login',loginLimiter, adminLogin);                         // POST /api/admin/login
router.get('/users', verifyToken, adminOnly, getUsers);     // GET /api/admin/users
router.post('/approve/:id', verifyToken, adminOnly, approveUser); // POST /api/admin/approve/:id
router.delete('/users/:id', verifyToken, adminOnly, deleteUser);  // DELETE /api/admin/users/:id

module.exports = router;
