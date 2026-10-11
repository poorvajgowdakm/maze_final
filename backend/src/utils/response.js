const success = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const fail = (res, error, message, statusCode = 400, data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
    data
  });
};

module.exports = { success, fail };
