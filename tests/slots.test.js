// Unit tests for the pure slot-building logic. No database needed.
const { buildSlots } = require('../src/services/slotService');
const { parseSql } = require('../src/lib/time');
const pool = require('../src/db');

afterAll(() => pool.end());

const base = {
  date: '2030-01-07',
  opensAt: '10:00:00',
  closesAt: '12:00:00',
  durationMinutes: 60,
  booked: [],
  now: parseSql('2029-12-31 09:00:00'),
};

test('a 60-minute service in a 2-hour window gives starts every 30 minutes that fit', () => {
  const slots = buildSlots(base);
  expect(slots.map((s) => s.time)).toEqual(['10:00', '10:30', '11:00']);
  expect(slots.every((s) => s.available)).toBe(true);
});

test('slots overlapping an existing booking are marked taken', () => {
  const booked = [{ start: parseSql('2030-01-07 11:00:00'), end: parseSql('2030-01-07 11:30:00') }];
  const slots = buildSlots({ ...base, booked });
  expect(slots.map((s) => s.available)).toEqual([true, false, false]);
});

test('start times already in the past are left out', () => {
  const slots = buildSlots({ ...base, now: parseSql('2030-01-07 10:31:00') });
  expect(slots.map((s) => s.time)).toEqual(['11:00']);
});

test('a closed day produces no slots', () => {
  expect(buildSlots({ ...base, opensAt: null, closesAt: null })).toEqual([]);
});
