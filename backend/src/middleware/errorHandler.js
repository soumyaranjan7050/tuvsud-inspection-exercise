// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.expose ? err.message : (status === 500 ? 'Internal error' : err.message);
  res.status(status).json({ error: message });
};

module.exports.httpError = function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
};
