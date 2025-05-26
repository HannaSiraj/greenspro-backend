// require('dotenv').config();
// const { Pool } = require('pg');

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// module.exports = pool;


// require('dotenv').config();
// const { Pool } = require('pg');

// const useSSL = process.env.USE_SSL === 'true';


// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
//   ssl: useSSL ? { rejectUnauthorized: false } : false,
// });

// module.exports = pool;


require('dotenv').config();
const { Pool } = require('pg');

console.log('USE_SSL:', process.env.USE_SSL); // 👈 Add this line

const useSSL = process.env.USE_SSL === 'true';

console.log('SSL Setting in Pool:', useSSL); // 👈 Add this too

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.connect()
  .then(() => console.log("✅ Connected to DB"))
  .catch((err) => console.error("❌ Database connection failed:", err.message));

module.exports = pool;

