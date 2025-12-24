const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'super_secret_key_silentcore'; // Change this in production

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 1. Connect to MongoDB (You need a local DB or MongoDB Atlas URL)
// For testing, if you have MongoDB installed locally: 'mongodb://localhost:27017/silentstore'
// Or use a free Atlas URL.
mongoose.connect('mongodb://localhost:27017/silentstore')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// 2. Create User Schema (Database Blueprint)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// 3. Register Route
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Hash the password so it's secure
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

// 4. Login Route
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        // Create a "token" (like a digital VIP pass)
        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});