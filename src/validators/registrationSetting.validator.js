const { body } = require('express-validator');

const updateRules = [
  body('isOpen').optional().isBoolean().withMessage('isOpen must be a boolean.'),
  body('closedMessage')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isLength({ max: 2000 })
    .withMessage('closedMessage must be at most 2000 characters.'),
];

module.exports = { updateRules };
