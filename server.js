const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

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
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

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
    db.get(
      'SELECT * FROM users WHERE LOWER(username) = ?',
      [lowercaseUsername],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'An error occurred during registration.' });
        }

        if (user) {
          return res.status(400).json({ error: 'Username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
          'INSERT INTO users (username, password, profilePicture) VALUES (?, ?, ?)',
          [lowercaseUsername, hashedPassword, profilePicture || 'https://via.placeholder.com/150'],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'An error occurred during registration.' });
            }
            res.status(201).json({ id: this.lastID, username: lowercaseUsername, profilePicture });
          }
        );
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

  const lowercaseUsername = username.toLowerCase();

  try {
    db.get(
      'SELECT * FROM users WHERE LOWER(username) = ?',
      [lowercaseUsername],
      async (err, user) => {
        if (err || !user) {
          return res.status(400).json({ error: 'Invalid username or password.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({ error: 'Invalid username or password.' });
        }

        res.json({ id: user.id, username: user.username, profilePicture: user.profilePicture });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// Upload media
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.media) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const media = req.files.media;
  const fileName = `${Date.now()}_${media.name}`;
  const filePath = path.join(__dirname, 'uploads', fileName);

  media.mv(filePath, (err) => {
    if (err) {
      console.error('Error moving file:', err);
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
        console.error('Error inserting message:', err);
        return res.status(500).json({ error: 'An error occurred while sending the message.' });
      }

      db.get('SELECT * FROM messages WHERE id = ?', [this.lastID], (err, message) => {
        if (err || !message) {
          console.error('Error fetching message:', err);
          return res.status(500).json({ error: 'An error occurred while fetching the message.' });
        }

        broadcastMessage(message); // Broadcast the message to all clients
        res.status(201).json(message);
      });
    }
  );
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
