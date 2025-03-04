const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL client setup
const client = new Client({
  connectionString: process.env.DATABASE_URL, // Use the connection string from Render
  ssl: { rejectUnauthorized: false }, // Required for Render's PostgreSQL
});

// Connect to the database
client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Connection error', err.stack));

// Create users table if it doesn't exist
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profilePicture TEXT
  )
`;
client.query(createTableQuery)
  .then(() => console.log('Users table created or already exists'))
  .catch(err => console.error('Error creating table', err));

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
    const result = await client.query(
      'INSERT INTO users (username, password, profilePicture) VALUES ($1, $2, $3) RETURNING *',
      [username, hashedPassword, profilePicture || 'https://via.placeholder.com/150']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation (username already exists)
      res.status(400).json({ error: 'Username already exists.' });
    } else {
      res.status(500).json({ error: 'An error occurred during registration.' });
    }
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
    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Return user data (excluding the password)
    res.json({ id: user.id, username: user.username, profilePicture: user.profilePicture });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// Change username
app.post('/change-username', async (req, res) => {
  const { userId, newUsername } = req.body;

  if (!userId || !newUsername) {
    return res.status(400).json({ error: 'User ID and new username are required.' });
  }

  try {
    // Check if the new username already exists
    const checkResult = await client.query('SELECT * FROM users WHERE username = $1', [newUsername]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    // Update the username
    const updateResult = await client.query(
      'UPDATE users SET username = $1 WHERE id = $2 RETURNING *',
      [newUsername, userId]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while updating the username.' });
  }
});

// Change profile picture
app.post('/change-profile-picture', async (req, res) => {
  const { userId, newProfilePicture } = req.body;

  if (!userId || !newProfilePicture) {
    return res.status(400).json({ error: 'User ID and new profile picture are required.' });
  }

  try {
    // Update the profile picture
    const result = await client.query(
      'UPDATE users SET profilePicture = $1 WHERE id = $2 RETURNING *',
      [newProfilePicture, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while updating the profile picture.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
