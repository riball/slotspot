const express = require('express');
const requireLogin = require('../middleware/requireLogin');
const bookingService = require('../services/bookingService');
const { str, id } = require('../lib/input');

const router = express.Router();
router.use(requireLogin);

router.post('/', async (req, res) => {
  const booking = await bookingService.createBooking({
    customerId: req.session.userId,
    businessId: id(req.body.businessId),
    serviceId: id(req.body.serviceId),
    startAt: str(req.body.startAt, 20),
  });
  res.status(201).json({ booking });
});

router.get('/mine', async (req, res) => {
  const bookings = await bookingService.listUpcoming(req.session.userId);
  res.json({ bookings });
});

router.post('/:id/cancel', async (req, res) => {
  await bookingService.cancelBooking({
    customerId: req.session.userId,
    bookingId: id(req.params.id),
  });
  res.json({ ok: true });
});

module.exports = router;
