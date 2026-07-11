const { body, param, query } = require('express-validator');
const {
  DEVOTEE_CATEGORY,
  NON_ATTENDING_TYPE,
  SHARED_ACCOMMODATION,
  FAMILY_ACCOMMODATION,
  ADDITIONAL_FAMILY_ACCOMMODATION,
  PREFERRED_SUBJECT,
  SERVICE,
  ACCOMMODATION_STATUS,
  values,
} = require('../constants/enums');

const SERVICE_VALUES = values(SERVICE);

/**
 * Shared field-level rules for create & update. On update every
 * field is optional; on create the required ones are enforced.
 */
const optionalEnum = (field, enumObj) =>
  body(field)
    .optional({ checkFalsy: true })
    .isIn(values(enumObj))
    .withMessage(`${field} is invalid.`);

const baseRules = [
  body('initiatedName')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 150 }),
  optionalEnum('nonAttendingType', NON_ATTENDING_TYPE),
  optionalEnum('sharedAccommodation', SHARED_ACCOMMODATION),
  optionalEnum('familyAccommodation', FAMILY_ACCOMMODATION),
  optionalEnum('additionalFamilyAccommodation', ADDITIONAL_FAMILY_ACCOMMODATION),
  optionalEnum('preferredSubject', PREFERRED_SUBJECT),
  body('preferredSubjectOther')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 200 }),
  body('arrivalDate').optional({ checkFalsy: true }).isISO8601().withMessage('arrivalDate must be a valid date.'),
  body('departureDate').optional({ checkFalsy: true }).isISO8601().withMessage('departureDate must be a valid date.'),
  body('arrivalTime')
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('arrivalTime must be HH:mm.'),
  body('departureTime')
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('departureTime must be HH:mm.'),
  body('needJourneyPrasad').optional().isBoolean().toBoolean(),
  body('ownFourWheeler').optional().isBoolean().toBoolean(),
  body('amountPaid')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('amountPaid must be a positive number.'),
  body('comments').optional({ checkFalsy: true }).isString().isLength({ max: 2000 }),
  body('familyMembers')
    .optional({ nullable: true })
    .isArray()
    .withMessage('familyMembers must be an array.'),
  body('familyMembers.*.name')
    .optional()
    .isString()
    .withMessage('Each family member requires a name.'),
  body('familyMembers.*.age')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Each family member age must be 0-120.'),
  body('services')
    .optional({ nullable: true })
    .isArray()
    .withMessage('services must be an array.'),
  body('services.*')
    .optional()
    .isIn(SERVICE_VALUES)
    .withMessage('One or more selected services are invalid.'),
];

const createRegistrationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ max: 150 }),
  body('age')
    .notEmpty()
    .withMessage('Age is required.')
    .isInt({ min: 0, max: 120 })
    .withMessage('Age must be between 0 and 120.'),
  body('devoteeCategory')
    .notEmpty()
    .withMessage('Devotee category is required.')
    .isIn(values(DEVOTEE_CATEGORY))
    .withMessage('Devotee category is invalid.'),
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required.')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Mobile number must be 10-15 digits.'),
  body('comingFrom')
    .trim()
    .notEmpty()
    .withMessage('Coming from is required.')
    .isLength({ max: 150 }),
  ...baseRules,
];

const updateRegistrationRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid registration id.'),
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('age').optional().isInt({ min: 0, max: 120 }),
  optionalEnum('devoteeCategory', DEVOTEE_CATEGORY),
  body('mobileNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Mobile number must be 10-15 digits.'),
  body('comingFrom').optional().trim().notEmpty().isLength({ max: 150 }),
  optionalEnum('accommodationStatus', ACCOMMODATION_STATUS),
  ...baseRules,
];

const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid registration id.'),
];

const listQueryRules = [
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  query('status').optional({ checkFalsy: true }).isIn(values(ACCOMMODATION_STATUS)),
  query('category').optional({ checkFalsy: true }).isIn(values(DEVOTEE_CATEGORY)),
  query('order').optional({ checkFalsy: true }).isIn(['asc', 'desc', 'ASC', 'DESC']),
];

module.exports = {
  createRegistrationRules,
  updateRegistrationRules,
  idParamRule,
  listQueryRules,
};
