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

app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Disable Express info header
app.disable('x-powered-by');

// Enable CORS with credentials
const corsOptions = {
  origin: 'https://greenspro-frontend-o5uj.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));  // enable preflight for all routes
// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   // credentials: true,
// }));

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

app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT;
console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

