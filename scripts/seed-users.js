// Creates the demo owner and customer accounts. Safe to re-run.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

const accounts = [
  { name: 'Demo Owner', email: 'owner@example.com', password: 'demo-owner-123', role: 'owner' },
  { name: 'Demo Customer', email: 'customer@example.com', password: 'demo-customer-123', role: 'customer' },
];

(async () => {
  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [account.name, account.email, passwordHash, account.role]
    );
    console.log(`Demo account ready: ${account.email} (password: ${account.password})`);
  }
  await pool.end();
})().catch(async (err) => {
  console.error('Seeding failed:', err.message);
  await pool.end();
  process.exit(1);
});
