const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Connecting to server (no DB specified):');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Password:', process.env.DB_PASSWORD ? '********' : '(none)');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('Successfully connected to the database server!');

    const [databases] = await connection.query('SHOW DATABASES');
    console.log('Available databases:', databases.map(d => Object.values(d)[0]));

    await connection.end();
  } catch (err) {
    console.error('Database connection failed!');
    console.error('Error Details:', err);
  }
}

testConnection();
