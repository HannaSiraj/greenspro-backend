// createAdmin.js
const bcrypt = require('bcryptjs');
const pool = require('./db');

const createAdmin = async () => {
  const email = 'admin@gmail.com';
  const password = 'admin@123';

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO admins (email, password, created_at) VALUES ($1, $2, NOW())',
      [email, hashedPassword]
    );
    console.log('✅ Admin created successfully.');
  } catch (err) {
    console.error('❌ Failed to create admin:', err.message);
  }
};

createAdmin();
