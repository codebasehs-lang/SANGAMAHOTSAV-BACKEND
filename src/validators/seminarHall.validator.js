const { body, param } = require('express-validator');

const createRules = [
  body('hallName')
    .trim()
    .notEmpty()
    .withMessage('Hall name is required.')
    .isLength({ max: 150 }),
  body('hallAddress')
    .trim()
    .notEmpty()
    .withMessage('Hall address is required.')
    .isLength({ max: 255 }),
  body('hallMapLink')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Hall map link must be a valid URL.')
    .isLength({ max: 500 }),
  body('isActive').optional().isBoolean().toBoolean(),
];

const updateRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid seminar hall id.'),
  body('hallName').optional().trim().notEmpty().isLength({ max: 150 }),
  body('hallAddress').optional().trim().notEmpty().isLength({ max: 255 }),
  body('hallMapLink')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .isLength({ max: 500 }),
  body('isActive').optional().isBoolean().toBoolean(),
];

const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid seminar hall id.'),
];

module.exports = { createRules, updateRules, idParamRule };
