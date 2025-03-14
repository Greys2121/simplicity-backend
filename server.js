const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// WebSocket connection
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast new messages to all connected clients
function broadcastMessage(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.log('Database file does not exist. Creating a new one...');
  fs.writeFileSync(dbPath, ''); // Create an empty file
}

// Initialize tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      profilePicture TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      profilePicture TEXT,
      text TEXT,
      mediaUrl TEXT,
      hideNameAndPfp BOOLEAN DEFAULT FALSE,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password, profilePicture } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const lowercaseUsername = username.toLowerCase();

  try {
    // Check if the username already exists (case-insensitive)
    db.get(
      'SELECT * FROM users WHERE LOWER(username) = ?',
      [lowercaseUsername],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'An error occurred during registration.' });
        }

        if (user) {
          return res.status(400).json({ error: 'Username already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        db.run(
          'INSERT INTO users (username, password, profilePicture) VALUES (?, ?, ?)',
          [lowercaseUsername, hashedPassword, profilePicture || 'https://via.placeholder.com/150'],
          function (err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'An error occurred during registration.' });
            }

            // Return the newly created user
            res.status(201).json({
              id: this.lastID,
              username: lowercaseUsername,
              profilePicture: profilePicture || 'https://via.placeholder.com/150',
            });
          }
        );
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
});

// Login an existing user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const lowercaseUsername = username.toLowerCase();

  try {
    // Find the user by username (case-insensitive)
    db.get(
      'SELECT * FROM users WHERE LOWER(username) = ?',
      [lowercaseUsername],
      async (err, user) => {
        if (err || !user) {
          return res.status(400).json({ error: 'Invalid username or password.' });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({ error: 'Invalid username or password.' });
        }

        // Return the user data
        res.json({
          id: user.id,
          username: user.username,
          profilePicture: user.profilePicture,
        });
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// Update profile picture
app.put('/users/:id/profilePicture', (req, res) => {
  const { id } = req.params;
  const { profilePicture } = req.body;

  if (!profilePicture) {
    return res.status(400).json({ error: 'Profile picture URL is required.' });
  }

  db.run(
    'UPDATE users SET profilePicture = ? WHERE id = ?',
    [profilePicture, id],
    function (err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'An error occurred while updating the profile picture.' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Update profile picture in all messages sent by this user
      db.run(
        'UPDATE messages SET profilePicture = ? WHERE username = (SELECT username FROM users WHERE id = ?)',
        [profilePicture, id],
        function (err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'An error occurred while updating the profile picture in messages.' });
          }

          res.status(200).json({ message: 'Profile picture updated successfully.' });
        }
      );
    }
  );
});

// Start the server
server.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
