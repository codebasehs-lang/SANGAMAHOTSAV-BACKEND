const jwt = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');
const { ADMIN_ROLE } = require('../constants/enums');

/**
 * Protects routes by requiring a valid Bearer JWT.
 * Attaches the decoded payload to req.user.
 */
const authGuard = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized(messages.UNAUTHORIZED));
  }

  try {
    // Throws JsonWebTokenError / TokenExpiredError, handled globally.
    req.user = jwt.verify(token);
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Restricts access to admins. In V1 only the ADMIN role exists,
 * but this keeps role checks explicit and future-proof.
 */
const requireAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== ADMIN_ROLE.ADMIN) {
    return next(ApiError.forbidden(messages.FORBIDDEN));
  }
  return next();
};

module.exports = { authGuard, requireAdmin };
