// An error with an HTTP status. Thrown anywhere, turned into a JSON response by errorHandler.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
