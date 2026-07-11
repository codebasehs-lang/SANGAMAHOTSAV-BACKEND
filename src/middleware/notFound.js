const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');

/**
 * Catch-all for unmatched routes. Forwards a 404 ApiError
 * to the global error handler.
 */
module.exports = (req, _res, next) => {
  next(ApiError.notFound(messages.ROUTE_NOT_FOUND));
};
