const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// Create users table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            profilePicture TEXT,
            banner TEXT
        )
    `);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Register a new user
app.post('/register', async (req, res) => {
    const { username, password, profilePicture } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        db.run(
            'INSERT INTO users (username, password, profilePicture, banner) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, profilePicture || 'https://via.placeholder.com/150', 'https://via.placeholder.com/1200x200'],
            function (err) {
                if (err) {
                    return res.status(400).json({ error: 'Username already exists.' });
                }
                res.status(201).json({ id: this.lastID, username, profilePicture, banner: 'https://via.placeholder.com/1200x200' });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
});

// Login an existing user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        // Find the user in the database
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err || !user) {
                return res.status(400).json({ error: 'Invalid username or password.' });
            }

            // Compare the provided password with the hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ error: 'Invalid username or password.' });
            }

            // Return user data (excluding the password)
            res.json({ id: user.id, username: user.username, profilePicture: user.profilePicture, banner: user.banner });
        });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

// Fetch user profile by username
app.get('/user/:username', (req, res) => {
    const { username } = req.params;

    db.get('SELECT id, username, profilePicture, banner FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(user);
    });
});

// Change username
app.post('/change-username', (req, res) => {
    const { userId, newUsername } = req.body;

    if (!userId || !newUsername) {
        return res.status(400).json({ error: 'User ID and new username are required.' });
    }

    // Check if the new username already exists
    db.get('SELECT * FROM users WHERE username = ?', [newUsername], (err, existingUser) => {
        if (err) {
            return res.status(500).json({ error: 'An error occurred while checking the username.' });
        }
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists.' });
        }

        // Update the username
        db.run(
            'UPDATE users SET username = ? WHERE id = ?',
            [newUsername, userId],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'An error occurred while updating the username.' });
                }

                // Fetch the updated user data
                db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                    if (err || !user) {
                        return res.status(500).json({ error: 'An error occurred while fetching the updated user data.' });
                    }

                    // Return the updated user data (excluding the password)
                    res.json({ id: user.id, username: user.username, profilePicture: user.profilePicture, banner: user.banner });
                });
            }
        );
    });
});

// Change profile picture
app.post('/change-profile-picture', (req, res) => {
    const { userId, newProfilePicture } = req.body;

    if (!userId || !newProfilePicture) {
        return res.status(400).json({ error: 'User ID and new profile picture are required.' });
    }

    // Update the profile picture
    db.run(
        'UPDATE users SET profilePicture = ? WHERE id = ?',
        [newProfilePicture, userId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'An error occurred while updating the profile picture.' });
            }

            // Fetch the updated user data
            db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                if (err || !user) {
                    return res.status(500).json({ error: 'An error occurred while fetching the updated user data.' });
                }

                // Return the updated user data (excluding the password)
                res.json({ id: user.id, username: user.username, profilePicture: user.profilePicture, banner: user.banner });
            });
        }
    );
});

// Change banner
app.post('/change-banner', (req, res) => {
    const { userId, newBanner } = req.body;

    if (!userId || !newBanner) {
        return res.status(400).json({ error: 'User ID and new banner are required.' });
    }

    // Update the banner
    db.run(
        'UPDATE users SET banner = ? WHERE id = ?',
        [newBanner, userId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'An error occurred while updating the banner.' });
            }

            // Fetch the updated user data
            db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                if (err || !user) {
                    return res.status(500).json({ error: 'An error occurred while fetching the updated user data.' });
                }

                // Return the updated user data (excluding the password)
                res.json({ id: user.id, username: user.username, profilePicture: user.profilePicture, banner: user.banner });
            });
        }
    );
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
