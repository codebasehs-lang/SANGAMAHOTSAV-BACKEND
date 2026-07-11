const { body, param, query } = require('express-validator');

const createRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ max: 150 }),
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required.')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Mobile number must be 10-15 digits.'),
  body('overallRating')
    .notEmpty()
    .withMessage('Overall rating is required.')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5.')
    .toInt(),
  body('suggestions')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 2000 }),
];

const listQueryRules = [
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  query('rating').optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }),
];

const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid feedback id.'),
];

module.exports = { createRules, listQueryRules, idParamRule };
