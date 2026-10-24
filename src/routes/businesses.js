const express = require('express');
const pool = require('../db');
const businessRepo = require('../repositories/businessRepo');
const slotService = require('../services/slotService');
const HttpError = require('../lib/httpError');
const { str, id } = require('../lib/input');

const router = express.Router();

// Filter options for the search page
router.get('/filters', async (req, res) => {
  res.json(await businessRepo.filters(pool));
});

// Search: ?q=&category=&area=
router.get('/', async (req, res) => {
  const businesses = await businessRepo.search(pool, {
    category: str(req.query.category, 60),
    area: str(req.query.area, 60),
    q: str(req.query.q, 100),
  });
  res.json({ businesses });
});

// One business with its services and opening hours
router.get('/:id', async (req, res) => {
  const businessId = id(req.params.id);
  const business = await businessRepo.findById(pool, businessId);
  if (!business) throw new HttpError(404, 'Business not found');

  const services = await businessRepo.findServices(pool, businessId);
  const hours = await businessRepo.findAllHours(pool, businessId);
  res.json({ business, services, hours });
});

// Free and taken start times for one service on one day: ?service=&date=YYYY-MM-DD
router.get('/:id/slots', async (req, res) => {
  const result = await slotService.getDaySlots({
    businessId: id(req.params.id),
    serviceId: id(req.query.service),
    date: str(req.query.date, 10),
  });
  res.json(result);
});

module.exports = router;
