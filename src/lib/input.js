const HttpError = require('./httpError');

// Turns any value into a trimmed string with a length cap. Missing values become ''.
function str(value, maxLength = 255) {
  return String(value ?? '').trim().slice(0, maxLength);
}

// Turns a route or body value into a positive whole number, or throws 400.
function id(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new HttpError(400, 'Invalid id');
  }
  return n;
}

module.exports = { str, id };
