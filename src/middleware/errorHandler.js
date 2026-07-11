const { ValidationError, UniqueConstraintError, DatabaseError } = require('sequelize');
const ApiError = require('../utils/ApiError');
const httpStatus = require('../constants/httpStatus');
const messages = require('../constants/messages');
const { ERROR_CODES } = messages;
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Global error handler — the single place where every error is
 * normalized into the API error envelope:
 *   { success:false, error:{ code, message, details } }
 *
 * Must be registered LAST, after all routes.
 */
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, _next) => {
  let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  let code = ERROR_CODES.INTERNAL_ERROR;
  let message = messages.INTERNAL_ERROR;
  let details = null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof UniqueConstraintError) {
    statusCode = httpStatus.CONFLICT;
    code = ERROR_CODES.CONFLICT;
    message = 'A record with the provided value already exists.';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof ValidationError) {
    statusCode = httpStatus.UNPROCESSABLE_ENTITY;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = messages.VALIDATION_FAILED;
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = httpStatus.UNAUTHORIZED;
    code = ERROR_CODES.UNAUTHORIZED;
    message = messages.TOKEN_INVALID;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = httpStatus.UNAUTHORIZED;
    code = ERROR_CODES.UNAUTHORIZED;
    message = messages.TOKEN_EXPIRED;
  } else if (err instanceof DatabaseError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'A database error occurred.';
  }

  // Log server errors with stack; log client errors at a lower level.
  if (statusCode >= 500) {
    logger.error(err.message, {
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  } else {
    logger.warn(message, { path: req.originalUrl, method: req.method });
  }

  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  if (env.nodeEnv !== 'production' && statusCode >= 500) {
    body.error.stack = err.stack;
  }

  return res.status(statusCode).json(body);
};
