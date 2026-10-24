const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const userRepo = require('../repositories/userRepo');
const HttpError = require('../lib/httpError');
const { str } = require('../lib/input');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// New id for every login, so an old session id cannot be reused.
function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.role = user.role;
      resolve();
    });
  });
}

router.post('/register', async (req, res) => {
  const name = str(req.body.name, 100);
  const email = str(req.body.email, 190).toLowerCase();
  const password = String(req.body.password || '');

  if (!name) throw new HttpError(400, 'Enter your name');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');

  const passwordHash = await bcrypt.hash(password, 12);
  let userId;
  try {
    userId = await userRepo.create(pool, { name, email, passwordHash, role: 'customer' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'An account with that email already exists');
    throw err;
  }

  const user = { id: userId, name, email, role: 'customer' };
  await startSession(req, user);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const email = str(req.body.email, 190).toLowerCase();
  const password = String(req.body.password || '');

  const user = await userRepo.findByEmail(pool, email);
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Email or password is incorrect');

  await startSession(req, user);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) throw new HttpError(401, 'Not logged in');
  const user = await userRepo.findById(pool, req.session.userId);
  if (!user) throw new HttpError(401, 'Not logged in');
  res.json({ user });
});

module.exports = router;
