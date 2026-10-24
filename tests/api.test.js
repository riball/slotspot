// HTTP-level checks: routes respond correctly and protected routes require login.
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');
const { dayAt, resetAndSeed } = require('./helpers');

let fx;
beforeEach(async () => {
  fx = await resetAndSeed();
});
afterAll(() => pool.end());

test('the slots endpoint returns slots for a day', async () => {
  const date = dayAt(3, '00:00').slice(0, 10);
  const res = await request(app).get(`/api/businesses/${fx.businessId}/slots?service=${fx.serviceId}&date=${date}`);

  expect(res.status).toBe(200);
  expect(res.body.slots.length).toBeGreaterThan(0);
  expect(res.body.slots[0]).toHaveProperty('available');
});

test('booking requires a logged-in session', async () => {
  const res = await request(app)
    .post('/api/bookings')
    .send({ businessId: fx.businessId, serviceId: fx.serviceId, startAt: dayAt(3, '10:00') });

  expect(res.status).toBe(401);
  expect(res.body.message).toMatch(/log in/i);
});

test('errors come back as { message }', async () => {
  const res = await request(app).get('/api/businesses/999999');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ message: 'Business not found' });
});
