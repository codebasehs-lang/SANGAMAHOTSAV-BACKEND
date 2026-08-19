const { body, param, query } = require('express-validator');
const {
  DEVOTEE_CATEGORY,
  DEVOTEE_ASHRAM,
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
  body('facilitatorName')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 150 }),
  body('gender')
    .optional({ checkFalsy: true })
    .isIn(['MALE', 'FEMALE'])
    .withMessage('gender must be MALE or FEMALE.'),
  body('devoteeAshram')
    .optional({ checkFalsy: true })
    .isIn(values(DEVOTEE_ASHRAM))
    .withMessage('devoteeAshram is invalid.'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('email must be a valid email address.')
    .isLength({ max: 254 }),
  body('country')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 100 })
    .withMessage('country must be at most 100 characters.'),
  body('state')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 100 })
    .withMessage('state must be at most 100 characters.'),
  body('district')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 150 })
    .withMessage('district must be at most 150 characters.'),
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
  body('paymentReferenceId')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 100 })
    .withMessage('paymentReferenceId must be at most 100 characters.'),
  body('payeeAccountName')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 150 })
    .withMessage('payeeAccountName must be at most 150 characters.'),
  body('allowPaymentScreenshotUpdate').optional().isBoolean().toBoolean(),
  body('comments').optional({ checkFalsy: true }).isString().isLength({ max: 2000 }),
  body('familyMembers')
    .optional({ nullable: true })
    .customSanitizer((val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    })
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
    .customSanitizer((val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    })
    .isArray()
    .withMessage('services must be an array.'),
  body('services.*')
    .optional()
    .isIn(SERVICE_VALUES)
    .withMessage('One or more selected services are invalid.'),
  body('donationItems')
    .optional({ nullable: true })
    .customSanitizer((val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    })
    .isArray()
    .withMessage('donationItems must be an array.'),
  body('donationItems.*.id')
    .optional()
    .isString()
    .withMessage('Each donation item must have an id.'),
  body('donationItems.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Each donation item amount must be a positive number.'),
  body('extraCharges')
    .optional({ nullable: true })
    .customSanitizer((val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    })
    .isArray()
    .withMessage('extraCharges must be an array.'),
  body('extraCharges.*')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Each extra charge code must be a short string.'),
];

const createRegistrationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ max: 150 })
    .withMessage('Name must be at most 150 characters.')
    .matches(/^[a-zA-Z .'`-]+$/)
    .withMessage('Name can only contain letters, spaces, dots, hyphens and apostrophes.'),
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
  body('comingFrom').optional().trim().isLength({ max: 150 }),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email ID must be a valid email address.')
    .isLength({ max: 254 }),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required.')
    .isLength({ max: 100 }),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required.')
    .isLength({ max: 100 }),
  body('district')
    .trim()
    .notEmpty()
    .withMessage('District is required.')
    .isLength({ max: 150 }),
  body('paymentScreenshot').custom((_, { req }) => {
    if (req.body.devoteeAshram === 'BRAHMACHARI') {
      return true;
    }
    // Check if at least one screenshot file is provided
    if (req.files && Object.keys(req.files).some(key => 
      (key === 'paymentScreenshot' || key === 'paymentScreenshot1' || key === 'paymentScreenshot2' || key === 'paymentScreenshot3') 
      && req.files[key]
    )) {
      return true;
    }

    throw new Error('Payment screenshot is required for this registration category.');
  }),
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
