const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');

/**
 * Runs a set of express-validator chains, then aggregates any errors
 * into a single 400 ApiError. Usage:
 *   router.post('/', validate(loginRules), controller.login)
 */
const validate = (validations) => async (req, _res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return next(ApiError.badRequest(messages.VALIDATION_FAILED, details));
};

module.exports = validate;
