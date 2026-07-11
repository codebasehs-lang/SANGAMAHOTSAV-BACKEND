const httpStatus = require('../constants/httpStatus');
const { ERROR_CODES } = require('../constants/messages');

/**
 * Operational error class. Thrown intentionally by the application
 * and handled by the global error middleware. Distinguishes expected
 * (operational) errors from unexpected programmer errors.
 */
class ApiError extends Error {
  constructor(
    statusCode,
    message,
    { code = ERROR_CODES.INTERNAL_ERROR, details = null } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(httpStatus.BAD_REQUEST, message, {
      code: ERROR_CODES.VALIDATION_ERROR,
      details,
    });
  }

  static unauthorized(message) {
    return new ApiError(httpStatus.UNAUTHORIZED, message, {
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }

  static forbidden(message) {
    return new ApiError(httpStatus.FORBIDDEN, message, {
      code: ERROR_CODES.FORBIDDEN,
    });
  }

  static notFound(message) {
    return new ApiError(httpStatus.NOT_FOUND, message, {
      code: ERROR_CODES.NOT_FOUND,
    });
  }

  static conflict(message, details = null) {
    return new ApiError(httpStatus.CONFLICT, message, {
      code: ERROR_CODES.CONFLICT,
      details,
    });
  }
}

module.exports = ApiError;
