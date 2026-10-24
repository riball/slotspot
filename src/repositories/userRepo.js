// SQL for users. Every function takes the db handle (the pool) as its first argument.
async function one(db, sql, params) {
  const [rows] = await db.query(sql, params);
  return rows[0] || null;
}

module.exports = {
  findByEmail(db, email) {
    return one(db, 'SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [email]);
  },

  findById(db, id) {
    return one(db, 'SELECT id, name, email, role FROM users WHERE id = ?', [id]);
  },

  async create(db, { name, email, passwordHash, role }) {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );
    return result.insertId;
  },
};
