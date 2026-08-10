require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/coaches', async (req, res) => {
  try {
    // Replace 'coaches_data' with your actual table name if different
    const [rows] = await db.query(`
      SELECT 
        \`Sr. No\`, \`Rm Name\`, \`Shift Name\`, \`Coach\`, 
        \`SF Coach Name\`, \`Start T\`, \`End T\`, 
        \`Monday\`, \`Tuesday\`, \`Wednesday\`, \`Thursday\`, \`Friday\`, 
        \`Shift Days\`, \`Standard / Rapid Rating\`, \`Can Teach Upto\`, 
        \`Demo(Yes/No)\`, \`Tier\`, \`Category\`, \`Ratings\`, \`Count of Coaches\`
      FROM coaches_data
    `);
    res.json(rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to fetch coaches data' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
