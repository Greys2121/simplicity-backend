const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Add your API endpoints here (e.g., /register, /login, etc.)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
