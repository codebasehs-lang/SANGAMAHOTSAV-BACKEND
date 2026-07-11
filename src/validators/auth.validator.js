const { body } = require('express-validator');

/**
 * Validation rules for authentication endpoints.
 */
const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('A valid email is required.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isString()
    .withMessage('Password must be a string.'),
];

module.exports = { loginRules };
