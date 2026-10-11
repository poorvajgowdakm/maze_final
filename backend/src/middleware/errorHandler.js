const { fail } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  // Default to 500 if not set or if headers already sent
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  if (err.name === 'ValidationError') {
      return fail(res, 'VALIDATION_ERROR', err.message, 400);
  }

  // Handle known standard errors
  fail(res, 'SERVER_ERROR', err.message || 'Internal Server Error', statusCode);
};

module.exports = errorHandler;
