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
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Log the database path for debugging
console.log('Database path:', dbPath);

// Initialize tables if they don't exist
const dbExists = fs.existsSync(dbPath);

db.serialize(() => {
  if (!dbExists) {
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
  }
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

            console.log('New user created:', {
              id: this.lastID,
              username: lowercaseUsername,
              profilePicture: profilePicture || 'https://via.placeholder.com/150',
            });

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

// Upload media
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.media) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const mediaFile = req.files.media;
  const fileName = `${Date.now()}_${mediaFile.name}`;
  const filePath = path.join(uploadsDir, fileName);

  mediaFile.mv(filePath, (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(500).json({ error: 'Failed to upload file.' });
    }

    res.json({ mediaUrl: `/uploads/${fileName}` });
  });
});

// Get all messages
app.get('/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY timestamp DESC', (err, messages) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch messages.' });
    }

    res.json(messages);
  });
});

// Post a new message
app.post('/messages', (req, res) => {
  const { username, profilePicture, text, mediaUrl, hideNameAndPfp } = req.body;

  if (!username || (!text && !mediaUrl)) {
    return res.status(400).json({ error: 'Invalid message data.' });
  }

  db.run(
    'INSERT INTO messages (username, profilePicture, text, mediaUrl, hideNameAndPfp) VALUES (?, ?, ?, ?, ?)',
    [username, profilePicture, text, mediaUrl, hideNameAndPfp],
    function (err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to post message.' });
      }

      const newMessage = {
        id: this.lastID,
        username,
        profilePicture,
        text,
        mediaUrl,
        hideNameAndPfp,
        timestamp: new Date().toISOString(),
      };

      broadcastMessage(newMessage);
      res.status(201).json(newMessage);
    }
  );
});

// Delete a message after 10 hours
setInterval(() => {
  db.run(
    'DELETE FROM messages WHERE timestamp < datetime("now", "-10 hours")',
    (err) => {
      if (err) {
        console.error('Error deleting old messages:', err);
      }
    }
  );
}, 3600000); // Run every hour

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
