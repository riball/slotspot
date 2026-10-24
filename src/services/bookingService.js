// Booking rules. createBooking is where double-booking is prevented.
const pool = require('../db');
const { parseSql, toSql, addMinutes } = require('../lib/time');
const HttpError = require('../lib/httpError');
const bookingRepo = require('../repositories/bookingRepo');
const businessRepo = require('../repositories/businessRepo');

const DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const CANCEL_CUTOFF_MINUTES = 120;

async function createBooking({ customerId, businessId, serviceId, startAt, now = new Date() }) {
  if (!DATETIME_RE.test(startAt)) {
    throw new HttpError(400, 'Choose a valid date and time');
  }
  const start = parseSql(startAt);
  if (start.getMinutes() % 30 !== 0) {
    throw new HttpError(400, 'Slots start on the half hour');
  }
  if (start <= now) {
    throw new HttpError(400, 'That time has already passed');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // This must be the first statement in the transaction. Locking the business row
    // makes every other booking for the same business wait here until we commit.
    // After the lock, the checks below see every booking committed before us.
    const [locked] = await conn.query('SELECT id FROM businesses WHERE id = ? FOR UPDATE', [businessId]);
    if (locked.length === 0) {
      throw new HttpError(404, 'Business not found');
    }

    const service = await businessRepo.findService(conn, businessId, serviceId);
    if (!service) {
      throw new HttpError(404, 'Service not found');
    }

    const end = addMinutes(start, service.duration_minutes);
    const day = startAt.slice(0, 10);

    const hours = await businessRepo.findHoursForWeekday(conn, businessId, start.getDay());
    if (!hours || !hours.opens_at) {
      throw new HttpError(400, 'The business is closed that day');
    }
    if (start < parseSql(`${day} ${hours.opens_at}`) || end > parseSql(`${day} ${hours.closes_at}`)) {
      throw new HttpError(400, 'That time is outside opening hours');
    }

    const clashes = await bookingRepo.countOverlapping(conn, businessId, toSql(start), toSql(end));
    if (clashes > 0) {
      throw new HttpError(409, 'This slot was just taken. Please choose another.');
    }

    const bookingId = await bookingRepo.insert(conn, {
      businessId,
      serviceId,
      customerId,
      startAt: toSql(start),
      endAt: toSql(end),
    });

    await conn.commit();
    return { id: bookingId, startAt: toSql(start), endAt: toSql(end) };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function cancelBooking({ customerId, bookingId, now = new Date() }) {
  const booking = await bookingRepo.findById(pool, bookingId);
  if (!booking || booking.customer_id !== customerId) {
    throw new HttpError(404, 'Booking not found');
  }
  if (booking.status !== 'confirmed') {
    throw new HttpError(400, 'This booking is already cancelled');
  }
  const minutesUntilStart = (parseSql(booking.start_at) - now) / 60000;
  if (minutesUntilStart < CANCEL_CUTOFF_MINUTES) {
    throw new HttpError(400, 'Bookings can only be cancelled more than 2 hours in advance');
  }
  await bookingRepo.cancel(pool, bookingId);
}

function listUpcoming(customerId, now = new Date()) {
  return bookingRepo.findUpcomingForCustomer(pool, customerId, toSql(now));
}

function scheduleForDay(businessId, date) {
  return bookingRepo.findScheduleForDay(pool, businessId, date);
}

module.exports = { createBooking, cancelBooking, listUpcoming, scheduleForDay };
