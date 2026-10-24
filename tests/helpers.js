const pool = require('../src/db');
const { toSql } = require('../src/lib/time');

// 'YYYY-MM-DD HH:MM' for a day N days from today (negative = past)
function dayAt(days, time) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return toSql(d).slice(0, 16);
}

// Wipes the test database and inserts one business with a 60-minute service,
// open 10:00 to 19:00 every day, plus two customers and an owner.
async function resetAndSeed() {
  const [[{ db }]] = await pool.query('SELECT DATABASE() AS db');
  if (!db || !db.endsWith('_test')) {
    throw new Error('Tests must run against a database whose name ends in _test');
  }

  const conn = await pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['bookings', 'services', 'opening_hours', 'businesses', 'users']) {
      await conn.query(`TRUNCATE TABLE ${table}`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const [users] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES
       ('Test Owner', 'owner@test.dev', 'not-used', 'owner'),
       ('Customer A', 'a@test.dev', 'not-used', 'customer'),
       ('Customer B', 'b@test.dev', 'not-used', 'customer')`
    );
    const ownerId = users.insertId;
    const customerA = users.insertId + 1;
    const customerB = users.insertId + 2;

    const [biz] = await conn.query(
      "INSERT INTO businesses (owner_id, name, category, area, address, description) VALUES (?, 'Test Salon', 'Salon', 'Indiranagar', '1 Test Road', 'Fixture')",
      [ownerId]
    );
    const businessId = biz.insertId;

    const [svc] = await conn.query(
      'INSERT INTO services (business_id, name, duration_minutes, price) VALUES (?, ?, 60, 500)',
      [businessId, 'Cut']
    );
    const serviceId = svc.insertId;

    for (let weekday = 0; weekday < 7; weekday++) {
      await conn.query(
        "INSERT INTO opening_hours (business_id, weekday, opens_at, closes_at) VALUES (?, ?, '10:00:00', '19:00:00')",
        [businessId, weekday]
      );
    }

    return { ownerId, customerA, customerB, businessId, serviceId };
  } finally {
    conn.release();
  }
}

module.exports = { dayAt, resetAndSeed };
