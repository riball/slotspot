// Booking rules, including the double-booking race. Runs against the test database.
const bookingService = require('../src/services/bookingService');
const bookingRepo = require('../src/repositories/bookingRepo');
const pool = require('../src/db');
const { toSql, addMinutes } = require('../src/lib/time');
const { dayAt, resetAndSeed } = require('./helpers');

let fx;
beforeEach(async () => {
  fx = await resetAndSeed();
});
afterAll(() => pool.end());

const book = (customerId, startAt) =>
  bookingService.createBooking({ customerId, businessId: fx.businessId, serviceId: fx.serviceId, startAt });

test('books a free slot inside opening hours', async () => {
  const booking = await book(fx.customerA, dayAt(3, '10:00'));
  expect(booking.id).toBeGreaterThan(0);
});

test('rejects a slot that is already taken', async () => {
  await book(fx.customerA, dayAt(3, '11:00'));
  await expect(book(fx.customerB, dayAt(3, '11:30'))).rejects.toMatchObject({ status: 409 });
});

test('two simultaneous bookings of the same slot: exactly one succeeds', async () => {
  const startAt = dayAt(4, '14:00');
  const results = await Promise.allSettled([
    book(fx.customerA, startAt),
    book(fx.customerB, startAt),
  ]);

  const succeeded = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');
  expect(succeeded).toHaveLength(1);
  expect(failed).toHaveLength(1);
  expect(failed[0].reason.status).toBe(409);

  const [rows] = await pool.query(
    'SELECT COUNT(*) AS n FROM bookings WHERE business_id = ? AND start_at = ?',
    [fx.businessId, `${startAt}:00`]
  );
  expect(rows[0].n).toBe(1);
});

test('rejects a time outside opening hours', async () => {
  await expect(book(fx.customerA, dayAt(3, '20:00'))).rejects.toMatchObject({ status: 400 });
});

test('rejects a start time that is not on the half hour', async () => {
  await expect(book(fx.customerA, dayAt(3, '10:15'))).rejects.toMatchObject({ status: 400 });
});

test('rejects a time that has already passed', async () => {
  await expect(book(fx.customerA, dayAt(-1, '10:00'))).rejects.toMatchObject({ status: 400 });
});

test('cancels a booking more than 2 hours ahead', async () => {
  const booking = await book(fx.customerA, dayAt(2, '12:00'));
  await bookingService.cancelBooking({ customerId: fx.customerA, bookingId: booking.id });

  const row = await bookingRepo.findById(pool, booking.id);
  expect(row.status).toBe('cancelled');
});

test('refuses to cancel less than 2 hours before the start', async () => {
  const soon = new Date();
  const start = addMinutes(soon, 90);
  const [result] = await pool.query(
    "INSERT INTO bookings (business_id, service_id, customer_id, start_at, end_at, status) VALUES (?, ?, ?, ?, ?, 'confirmed')",
    [fx.businessId, fx.serviceId, fx.customerA, toSql(start), toSql(addMinutes(start, 60))]
  );
  await expect(
    bookingService.cancelBooking({ customerId: fx.customerA, bookingId: result.insertId })
  ).rejects.toMatchObject({ status: 400 });
});

test('customers cannot cancel someone else’s booking', async () => {
  const booking = await book(fx.customerA, dayAt(2, '13:00'));
  await expect(
    bookingService.cancelBooking({ customerId: fx.customerB, bookingId: booking.id })
  ).rejects.toMatchObject({ status: 404 });
});
