const { body, param } = require('express-validator');
const { ROOM_TYPE, values } = require('../constants/enums');

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

const roomIdParamRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid hotel id.'),
  param('roomId').isInt({ min: 1 }).withMessage('Invalid room id.'),
];

const createRoomRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid hotel id.'),
  body('roomNo')
    .trim()
    .notEmpty()
    .withMessage('Room number is required.')
    .isLength({ max: 30 }),
  body('roomType')
    .isIn(values(ROOM_TYPE))
    .withMessage('Invalid room type.'),
  body('roomCapacity')
    .isInt({ min: 1 })
    .withMessage('Room capacity must be at least 1.'),
  body('currentOccupancy')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Current occupancy must be 0 or more.'),
  body('isActive').optional().isBoolean().toBoolean(),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 255 }),
];

const updateRoomRules = [
  ...roomIdParamRule,
  body('roomNo').optional().trim().notEmpty().isLength({ max: 30 }),
  body('roomType').optional().isIn(values(ROOM_TYPE)),
  body('roomCapacity').optional().isInt({ min: 1 }),
  body('currentOccupancy').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean().toBoolean(),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 255 }),
];

module.exports = {
  createRules,
  updateRules,
  idParamRule,
  roomIdParamRule,
  createRoomRules,
  updateRoomRules,
};
