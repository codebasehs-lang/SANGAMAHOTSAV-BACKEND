const { body, param } = require('express-validator');

const createRules = [
  body('hotelName')
    .trim()
    .notEmpty()
    .withMessage('Hotel name is required.')
    .isLength({ max: 150 }),
  body('hotelAddress')
    .trim()
    .notEmpty()
    .withMessage('Hotel address is required.')
    .isLength({ max: 255 }),
  body('hotelMapLink')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Hotel map link must be a valid URL.')
    .isLength({ max: 500 }),
];

const updateRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid hotel id.'),
  body('hotelName').optional().trim().notEmpty().isLength({ max: 150 }),
  body('hotelAddress').optional().trim().notEmpty().isLength({ max: 255 }),
  body('hotelMapLink')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .isLength({ max: 500 }),
];

const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid hotel id.'),
];

module.exports = { createRules, updateRules, idParamRule };
