const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  abortOnLimit: true,
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// Create users table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      profilePicture TEXT
    )
  `);

  // Create messages table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      profilePicture TEXT,
      text TEXT,
      mediaUrl TEXT,
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

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    db.run(
      'INSERT INTO users (username, password, profilePicture) VALUES (?, ?, ?)',
      [username, hashedPassword, profilePicture || 'https://via.placeholder.com/150'],
      function (err) {
        if (err) {
          return res.status(400).json({ error: 'Username already exists.' });
        }
        res.status(201).json({ id: this.lastID, username, profilePicture });
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
      res.json({ id: user.id, username: user.username, profilePicture: user.profilePicture });
    });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// Upload media (images/videos)
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.media) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const media = req.files.media;
  const fileName = `${Date.now()}_${media.name}`;
  const filePath = path.join(__dirname, 'uploads', fileName);

  media.mv(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to upload file.' });
    }

    res.json({ mediaUrl: `/uploads/${fileName}` });
  });
});

// Fetch all messages
app.get('/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY timestamp ASC', (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred while fetching messages.' });
    }
    res.json(messages);
  });
});

// Send a new message
app.post('/messages', (req, res) => {
  const { username, profilePicture, text, mediaUrl } = req.body;

  if (!username || (!text && !mediaUrl)) {
    return res.status(400).json({ error: 'Username and text or media are required.' });
  }

  db.run(
    'INSERT INTO messages (username, profilePicture, text, mediaUrl) VALUES (?, ?, ?, ?)',
    [username, profilePicture, text, mediaUrl],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'An error occurred while sending the message.' });
      }

      // Fetch the newly inserted message
      db.get('SELECT * FROM messages WHERE id = ?', [this.lastID], (err, message) => {
        if (err || !message) {
          return res.status(500).json({ error: 'An error occurred while fetching the message.' });
        }
        res.status(201).json(message);
      });
    }
  );
});

// Function to delete messages older than 1 hour
function deleteOldMessages() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  db.run(
    'DELETE FROM messages WHERE timestamp < ?',
    [oneHourAgo],
    function (err) {
      if (err) {
        console.error('Error deleting old messages:', err);
      } else {
        console.log(`Deleted ${this.changes} old messages.`);
      }
    }
  );
}

// Schedule the cleanup task to run every hour
setInterval(deleteOldMessages, 60 * 60 * 1000);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  deleteOldMessages(); // Run cleanup task on server start
});
