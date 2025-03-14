const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use a writable directory for the database file
const dbPath = process.env.DB_PATH || path.join('/tmp', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the database at:', dbPath);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      profilePicture TEXT
    )
  `);
});

module.exports = db;
