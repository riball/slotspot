// One shared connection pool. Uses the test database when NODE_ENV=test.
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.NODE_ENV === 'test' ? process.env.DB_TEST_NAME : process.env.DB_NAME || 'slotspot',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATETIME and TIME come back as plain strings, e.g. '2026-10-25 10:00:00'
});

module.exports = pool;
