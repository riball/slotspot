const pool = require('../db');
const businessRepo = require('../repositories/businessRepo');
const HttpError = require('../lib/httpError');

// Lets owners through and attaches their business as req.business.
module.exports = async function requireOwner(req, res, next) {
  if (!req.session.userId) {
    return next(new HttpError(401, 'Please log in first'));
  }
  if (req.session.role !== 'owner') {
    return next(new HttpError(403, 'Owner accounts only'));
  }
  const business = await businessRepo.findByOwner(pool, req.session.userId);
  if (!business) {
    return next(new HttpError(404, 'No business is linked to this account'));
  }
  req.business = business;
  next();
};
