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
 * Restricts access to admins (ADMIN or VIEWER can enter the panel).
 */
const requireAdmin = (req, _res, next) => {
  const role = req.user?.role;
  if (role !== ADMIN_ROLE.ADMIN && role !== ADMIN_ROLE.VIEWER) {
    return next(ApiError.forbidden(messages.FORBIDDEN));
  }
  return next();
};

/**
 * Restricts write operations to ADMIN role only.
 * VIEWER role gets a 403.
 */
const requireEditor = (req, _res, next) => {
  if (!req.user || req.user.role !== ADMIN_ROLE.ADMIN) {
    return next(ApiError.forbidden('This action requires Editor access. Viewers have read-only access.'));
  }
  return next();
};

module.exports = { authGuard, requireAdmin, requireEditor };
