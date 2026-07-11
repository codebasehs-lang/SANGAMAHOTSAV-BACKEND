/**
 * Human-readable messages and machine error codes.
 * Keeps API responses consistent and localizable.
 */
const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
});

module.exports = Object.freeze({
  // Generic
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_FAILED: 'Validation failed.',
  NOT_FOUND: 'The requested resource was not found.',
  ROUTE_NOT_FOUND: 'The requested route does not exist.',

  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password.',
  UNAUTHORIZED: 'Authentication required.',
  TOKEN_EXPIRED: 'Session expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication token.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  ACCOUNT_INACTIVE: 'This account is inactive.',

  // Success
  LOGIN_SUCCESS: 'Logged in successfully.',
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  FETCHED: 'Fetched successfully.',

  ERROR_CODES,
});
