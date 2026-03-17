const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token in the Authorization header.
 * For Day 1: includes a bypass for development mode.
 */
const authenticate = (req, res, next) => {
  // Development bypass — allows unauthenticated requests during Day 1
  if (config.nodeEnv === 'development') {
    req.user = { id: 'dev-user-001', username: 'developer', plan: 'free' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization token',
        status: 401,
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token is invalid or has expired',
        status: 401,
      },
    });
  }
};

module.exports = { authenticate };
