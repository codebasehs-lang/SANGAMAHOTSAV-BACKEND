/**
 * Standard success response envelope.
 * Usage: return ApiResponse.send(res, { data, message, statusCode, meta });
 */
const httpStatus = require('../constants/httpStatus');

class ApiResponse {
  static send(
    res,
    { data = null, message = 'Success', statusCode = httpStatus.OK, meta = null } = {}
  ) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created(res, { data = null, message = 'Created', meta = null } = {}) {
    return ApiResponse.send(res, {
      data,
      message,
      meta,
      statusCode: httpStatus.CREATED,
    });
  }
}

module.exports = ApiResponse;
