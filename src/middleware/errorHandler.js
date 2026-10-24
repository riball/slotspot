// Every error becomes { "message": "..." } with a sensible status code.
module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({ message: 'This service has bookings, so it cannot be deleted' });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'That already exists' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
};
