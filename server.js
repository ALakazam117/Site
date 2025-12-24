const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();

// ----------------------------------------------------
// CRITICAL FIX 1: Use the Port Render gives us
// ----------------------------------------------------
const PORT = process.env.PORT || 5000; 

const SECRET_KEY = 'super_secret_key_silentcore'; 

// Middleware
// ----------------------------------------------------
// CRITICAL FIX 2: explicit CORS to allow your store
// ----------------------------------------------------
app.use(cors({
    origin: '*', // Allows all websites (simplest for now)
    methods: ['GET', 'POST']
}));
app.use(bodyParser.json());

// ----------------------------------------------------
// CRITICAL FIX 3: Use the Database Link from Render
// ----------------------------------------------------
const dbURI = process.env.MONGO_URI;

if (!dbURI) {
    console.error("ERROR: MONGO_URI is missing. Check Render Environment Variables.");
}

mongoose.connect(dbURI || 'mongodb://localhost:27017/silentstore')
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.log('❌ DB Connection Error:', err));

// Database Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// Register Route
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: 'Error creating user (Duplicate name?)' });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});