const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet'); 
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Load env variables
dotenv.config();

const app = express();

// Security headers
app.use(helmet());

// Disable Express info header
app.disable('x-powered-by');

// Enable CORS with credentials
app.use(cors({
  origin: process.env.FRONTEND_URL,
  // credentials: true,
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Server is up and running ✅');
});

// Start server
const PORT = process.env.PORT ;
console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

