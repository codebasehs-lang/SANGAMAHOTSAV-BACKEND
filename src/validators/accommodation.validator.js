const { body, param, query } = require('express-validator');
const { ASSIGNMENT_STATUS, values } = require('../constants/enums');

const assignmentBody = [
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
  body('roomNumber')
    .trim()
    .notEmpty()
    .withMessage('Room number is required.')
    .isLength({ max: 30 }),
  body('hotelMapLink')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Hotel map link must be a valid URL.')
    .isLength({ max: 500 }),
  body('status')
    .optional()
    .isIn(values(ASSIGNMENT_STATUS))
    .withMessage('Invalid assignment status.'),
];

const assignRules = [
  param('registrationId')
    .isInt({ min: 1 })
    .withMessage('Invalid registration id.'),
  ...assignmentBody,
];

const updateRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid assignment id.'),
  body('hotelName').optional().trim().notEmpty().isLength({ max: 150 }),
  body('hotelAddress').optional().trim().notEmpty().isLength({ max: 255 }),
  body('roomNumber').optional().trim().notEmpty().isLength({ max: 30 }),
  body('hotelMapLink')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .isLength({ max: 500 }),
  body('status').optional().isIn(values(ASSIGNMENT_STATUS)),
];

const registrationIdParam = [
  param('registrationId')
    .isInt({ min: 1 })
    .withMessage('Invalid registration id.'),
];

const listQueryRules = [
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  query('status').optional({ checkFalsy: true }).isIn(values(ASSIGNMENT_STATUS)),
];

module.exports = {
  assignRules,
  updateRules,
  registrationIdParam,
  listQueryRules,
};
