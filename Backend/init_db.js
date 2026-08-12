const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  console.log('Connecting to MySQL server...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT || 3306);
  console.log('User:', process.env.DB_USER);
  console.log('Database Name:', process.env.DB_NAME);

  const connectionOptions = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };

  try {
    // For cloud environments (like Aiven), DB_NAME is usually 'defaultdb' and already exists.
    // We only try to create the database if it's NOT 'defaultdb'.
    if (process.env.DB_NAME && process.env.DB_NAME !== 'defaultdb') {
      console.log(`Creating database "${process.env.DB_NAME}" if it doesn't exist...`);
      const connection = await mysql.createConnection(connectionOptions);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
      console.log('Database created/verified successfully!');
      await connection.end();
    } else {
      console.log('Skipping database creation step (using pre-existing database)...');
    }

    // Reconnect to the database to create the table
    const dbConnection = await mysql.createConnection({
      ...connectionOptions,
      database: process.env.DB_NAME || 'coachschedular'
    });

    console.log('Creating table "coaches_data" if it doesn\'t exist...');
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS coaches_data (
        \`Sr. No\` INT AUTO_INCREMENT PRIMARY KEY,
        \`Rm Name\` VARCHAR(255),
        \`Shift Name\` VARCHAR(255),
        \`Coach\` VARCHAR(255),
        \`SF Coach Name\` VARCHAR(255),
        \`Start T\` VARCHAR(255),
        \`End T\` VARCHAR(255),
        \`Monday\` VARCHAR(255),
        \`Tuesday\` VARCHAR(255),
        \`Wednesday\` VARCHAR(255),
        \`Thursday\` VARCHAR(255),
        \`Friday\` VARCHAR(255),
        \`Shift Days\` VARCHAR(255),
        \`Standard / Rapid Rating\` VARCHAR(255),
        \`Can Teach Upto\` VARCHAR(255),
        \`Demo(Yes/No)\` VARCHAR(255),
        \`Tier\` VARCHAR(255),
        \`Category\` VARCHAR(255),
        \`Ratings\` VARCHAR(255),
        \`Count of Coaches\` INT
      )
    `);
    console.log('Table "coaches_data" created/verified successfully!');
    
    // Check if table has any data
    const [rows] = await dbConnection.query('SELECT COUNT(*) AS count FROM coaches_data');
    console.log(`Current row count in coaches_data: ${rows[0].count}`);

    await dbConnection.end();
    console.log('Database initialization completed successfully!');
  } catch (err) {
    console.error('Failed to initialize database:');
    console.error(err);
  }
}

initDB();
