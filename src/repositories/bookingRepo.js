// SQL for bookings. Every function takes the db handle (the pool, or a transaction connection).
async function one(db, sql, params) {
  const [rows] = await db.query(sql, params);
  return rows[0] || null;
}

module.exports = {
  async findConfirmedForDay(db, businessId, date) {
    const [rows] = await db.query(
      "SELECT start_at, end_at FROM bookings WHERE business_id = ? AND status = 'confirmed' AND DATE(start_at) = ?",
      [businessId, date]
    );
    return rows;
  },

  // Counts confirmed bookings that overlap [startSql, endSql).
  async countOverlapping(db, businessId, startSql, endSql) {
    const row = await one(
      db,
      "SELECT COUNT(*) AS n FROM bookings WHERE business_id = ? AND status = 'confirmed' AND start_at < ? AND end_at > ?",
      [businessId, endSql, startSql]
    );
    return row.n;
  },

  async insert(db, { businessId, serviceId, customerId, startAt, endAt }) {
    const [result] = await db.query(
      "INSERT INTO bookings (business_id, service_id, customer_id, start_at, end_at, status) VALUES (?, ?, ?, ?, ?, 'confirmed')",
      [businessId, serviceId, customerId, startAt, endAt]
    );
    return result.insertId;
  },

  findById(db, id) {
    return one(db, 'SELECT id, customer_id, start_at, end_at, status FROM bookings WHERE id = ?', [id]);
  },

  async cancel(db, id) {
    await db.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [id]);
  },

  async findUpcomingForCustomer(db, customerId, nowSql) {
    const [rows] = await db.query(
      `SELECT b.id, b.start_at, b.end_at, s.name AS service_name, s.price,
              bus.name AS business_name, bus.address
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN businesses bus ON bus.id = b.business_id
       WHERE b.customer_id = ? AND b.status = 'confirmed' AND b.start_at >= ?
       ORDER BY b.start_at`,
      [customerId, nowSql]
    );
    return rows;
  },

  async findScheduleForDay(db, businessId, date) {
    const [rows] = await db.query(
      `SELECT b.id, b.start_at, b.end_at, s.name AS service_name, u.name AS customer_name
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.customer_id
       WHERE b.business_id = ? AND b.status = 'confirmed' AND DATE(b.start_at) = ?
       ORDER BY b.start_at`,
      [businessId, date]
    );
    return rows;
  },
};
