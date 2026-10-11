const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

const requireLogin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 'UNAUTHORIZED', 'Authentication token missing or invalid', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, ... }
    next();
  } catch (err) {
    return fail(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return fail(res, 'FORBIDDEN', 'Requires admin privileges', 403);
  }
};

module.exports = { requireLogin, requireAdmin };
