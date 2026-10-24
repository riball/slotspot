// Works out which start times are free on a given day.
const pool = require('../db');
const { parseSql, addMinutes, hhmm } = require('../lib/time');
const HttpError = require('../lib/httpError');
const businessRepo = require('../repositories/businessRepo');
const bookingRepo = require('../repositories/bookingRepo');

const STEP_MINUTES = 30;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Pure function (no database), so it is easy to test.
// Returns every start time that fits inside opening hours and is not in the past.
// Each slot says whether it is free. Taken slots are kept so the grid can grey them out.
function buildSlots({ date, opensAt, closesAt, durationMinutes, booked, now, stepMinutes = STEP_MINUTES }) {
  if (!opensAt || !closesAt) return [];

  const open = parseSql(`${date} ${opensAt}`);
  const close = parseSql(`${date} ${closesAt}`);
  const slots = [];

  for (let start = open; addMinutes(start, durationMinutes) <= close; start = addMinutes(start, stepMinutes)) {
    if (start <= now) continue;
    const end = addMinutes(start, durationMinutes);
    const taken = booked.some((b) => b.start < end && b.end > start);
    slots.push({ time: hhmm(start), available: !taken });
  }
  return slots;
}

async function getDaySlots({ businessId, serviceId, date, now = new Date() }) {
  if (!DATE_RE.test(date)) {
    throw new HttpError(400, 'Choose a valid date');
  }

  const service = await businessRepo.findService(pool, businessId, serviceId);
  if (!service) {
    throw new HttpError(404, 'Service not found');
  }

  const weekday = parseSql(`${date} 00:00`).getDay();
  const hours = await businessRepo.findHoursForWeekday(pool, businessId, weekday);
  const rows = await bookingRepo.findConfirmedForDay(pool, businessId, date);
  const booked = rows.map((r) => ({ start: parseSql(r.start_at), end: parseSql(r.end_at) }));

  const slots = buildSlots({
    date,
    opensAt: hours ? hours.opens_at : null,
    closesAt: hours ? hours.closes_at : null,
    durationMinutes: service.duration_minutes,
    booked,
    now,
  });

  return { date, durationMinutes: service.duration_minutes, slots };
}

module.exports = { buildSlots, getDaySlots };
