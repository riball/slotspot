const HttpError = require('../lib/httpError');

module.exports = function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return next(new HttpError(401, 'Please log in first'));
  }
  next();
};
