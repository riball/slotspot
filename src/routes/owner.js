const express = require('express');
const pool = require('../db');
const businessRepo = require('../repositories/businessRepo');
const bookingService = require('../services/bookingService');
const requireOwner = require('../middleware/requireOwner');
const HttpError = require('../lib/httpError');
const { str, id } = require('../lib/input');

const router = express.Router();
router.use(requireOwner);

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseService(body) {
  const name = str(body.name, 120);
  const duration = Number(body.duration);
  const price = Number(body.price);

  if (!name) throw new HttpError(400, 'Enter a service name');
  if (!Number.isInteger(duration) || duration < 15 || duration > 240) {
    throw new HttpError(400, 'Duration must be between 15 and 240 minutes');
  }
  if (!Number.isInteger(price) || price < 0 || price > 100000) {
    throw new HttpError(400, 'Enter a price in whole rupees');
  }
  return { name, duration, price };
}

router.get('/business', (req, res) => {
  res.json({ business: req.business });
});

router.get('/schedule', async (req, res) => {
  const date = str(req.query.date, 10);
  if (!DATE_RE.test(date)) throw new HttpError(400, 'Choose a valid date');
  const bookings = await bookingService.scheduleForDay(req.business.id, date);
  res.json({ bookings });
});

router.post('/services', async (req, res) => {
  const serviceId = await businessRepo.createService(pool, req.business.id, parseService(req.body));
  res.status(201).json({ id: serviceId });
});

router.put('/services/:id', async (req, res) => {
  const serviceId = id(req.params.id);
  const existing = await businessRepo.findService(pool, req.business.id, serviceId);
  if (!existing) throw new HttpError(404, 'Service not found');
  await businessRepo.updateService(pool, req.business.id, serviceId, parseService(req.body));
  res.json({ ok: true });
});

router.delete('/services/:id', async (req, res) => {
  const serviceId = id(req.params.id);
  const existing = await businessRepo.findService(pool, req.business.id, serviceId);
  if (!existing) throw new HttpError(404, 'Service not found');
  await businessRepo.deleteService(pool, req.business.id, serviceId);
  res.json({ ok: true });
});

// Body: { hours: [ { weekday: 0-6, opens: "10:00" | null, closes: "19:00" | null }, ...7 entries ] }
router.put('/hours', async (req, res) => {
  const input = Array.isArray(req.body.hours) ? req.body.hours : [];
  if (input.length !== 7) throw new HttpError(400, 'Send all seven days');

  const days = input.map((day) => {
    const weekday = Number(day.weekday);
    const opens = day.opens || null;
    const closes = opens ? day.closes || null : null;
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      throw new HttpError(400, 'Invalid day');
    }
    if ((opens && !TIME_RE.test(opens)) || (closes && !TIME_RE.test(closes))) {
      throw new HttpError(400, 'Use HH:MM times');
    }
    if (opens && (!closes || closes <= opens)) {
      throw new HttpError(400, 'Closing time must be after opening time');
    }
    return { weekday, opens, closes };
  });

  if (new Set(days.map((d) => d.weekday)).size !== 7) {
    throw new HttpError(400, 'Each day should appear once');
  }

  for (const day of days) {
    await businessRepo.upsertHours(
      pool,
      req.business.id,
      day.weekday,
      day.opens ? `${day.opens}:00` : null,
      day.closes ? `${day.closes}:00` : null
    );
  }
  res.json({ ok: true });
});

module.exports = router;
