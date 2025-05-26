// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// // Simulated DB (replace with real DB)
// let users = [
//   // { id: 1, email: 'user@example.com', password: '123456', approved: true }
// ];

// // Signup controller
// const signup = (req, res) => {
//   const { email, password } = req.body;

//   if (users.find(u => u.email === email)) {
//     return res.status(400).json({ message: 'Email already registered' });
//   }

//   const newUser = {
//     id: users.length + 1,
//     email,
//     password, // In real apps, hash this!
//     approved: false // user must be approved by admin
//   };

//   users.push(newUser);
//   return res.status(201).json({ message: 'User registered. Await admin approval.' });
// };

// // Login controller
// const login = (req, res) => {
//   const { email, password } = req.body;

//   const user = users.find(u => u.email === email && u.password === password);

//   if (!user) {
//     return res.status(401).json({ message: 'Invalid credentials' });
//   }

//   if (!user.approved) {
//     return res.status(403).json({ message: 'User not approved yet' });
//   }

//   const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
//     expiresIn: '1h',
//   });

//   res.json({ token });
// };

// // Protected landing page example
// const landing = (req, res) => {
//   res.json({ message: `Welcome to the landing page, ${req.user.email}` });
// };

// module.exports = { signup, login, landing };
