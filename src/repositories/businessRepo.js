// SQL for businesses, services, and opening hours.
async function one(db, sql, params) {
  const [rows] = await db.query(sql, params);
  return rows[0] || null;
}

module.exports = {
  async search(db, { category, area, q }) {
    const where = [];
    const params = [];
    if (category) { where.push('category = ?'); params.push(category); }
    if (area) { where.push('area = ?'); params.push(area); }
    if (q) { where.push('name LIKE ?'); params.push(`%${q}%`); }

    const sql = 'SELECT id, name, category, area, address, description FROM businesses' +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      ' ORDER BY name';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async filters(db) {
    const [categories] = await db.query('SELECT DISTINCT category FROM businesses ORDER BY category');
    const [areas] = await db.query('SELECT DISTINCT area FROM businesses ORDER BY area');
    return {
      categories: categories.map((r) => r.category),
      areas: areas.map((r) => r.area),
    };
  },

  findById(db, id) {
    return one(db, 'SELECT id, name, category, area, address, description FROM businesses WHERE id = ?', [id]);
  },

  findByOwner(db, ownerId) {
    return one(db, 'SELECT id, owner_id, name, category, area, address, description FROM businesses WHERE owner_id = ?', [ownerId]);
  },

  async findServices(db, businessId) {
    const [rows] = await db.query(
      'SELECT id, name, duration_minutes, price FROM services WHERE business_id = ? ORDER BY name',
      [businessId]
    );
    return rows;
  },

  findService(db, businessId, serviceId) {
    return one(db, 'SELECT id, name, duration_minutes, price FROM services WHERE id = ? AND business_id = ?', [serviceId, businessId]);
  },

  async createService(db, businessId, { name, duration, price }) {
    const [result] = await db.query(
      'INSERT INTO services (business_id, name, duration_minutes, price) VALUES (?, ?, ?, ?)',
      [businessId, name, duration, price]
    );
    return result.insertId;
  },

  async updateService(db, businessId, serviceId, { name, duration, price }) {
    await db.query(
      'UPDATE services SET name = ?, duration_minutes = ?, price = ? WHERE id = ? AND business_id = ?',
      [name, duration, price, serviceId, businessId]
    );
  },

  async deleteService(db, businessId, serviceId) {
    await db.query('DELETE FROM services WHERE id = ? AND business_id = ?', [serviceId, businessId]);
  },

  async findAllHours(db, businessId) {
    const [rows] = await db.query(
      'SELECT weekday, opens_at, closes_at FROM opening_hours WHERE business_id = ? ORDER BY weekday',
      [businessId]
    );
    return rows;
  },

  findHoursForWeekday(db, businessId, weekday) {
    return one(db, 'SELECT opens_at, closes_at FROM opening_hours WHERE business_id = ? AND weekday = ?', [businessId, weekday]);
  },

  async upsertHours(db, businessId, weekday, opensAt, closesAt) {
    await db.query(
      `INSERT INTO opening_hours (business_id, weekday, opens_at, closes_at) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE opens_at = VALUES(opens_at), closes_at = VALUES(closes_at)`,
      [businessId, weekday, opensAt, closesAt]
    );
  },
};
