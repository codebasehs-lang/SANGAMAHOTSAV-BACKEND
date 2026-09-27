const { body, param, query } = require('express-validator');
const { SMS_CAMPAIGN_TYPE, MESSAGE_CHANNEL, values } = require('../constants/enums');

const sendCampaignRules = [
  body('type')
    .notEmpty()
    .withMessage('SMS type is required.')
    .isIn(values(SMS_CAMPAIGN_TYPE))
    .withMessage('Invalid SMS type.'),
  body('message')
    .if(body('type').equals(SMS_CAMPAIGN_TYPE.CUSTOM))
    .trim()
    .notEmpty()
    .withMessage('Message is required for a custom campaign.')
    .isLength({ max: 1000 })
    .withMessage('Message must not exceed 1000 characters.'),
  body('registrationIds')
    .if((value, { req }) =>
      req.body.type === SMS_CAMPAIGN_TYPE.DONATION &&
      req.body.recipientMode !== 'ANY_DEVOTEE'
    )
    .isArray({ min: 1 })
    .withMessage('Select at least one donor.'),
  body('registrationIds')
    .if((value, { req }) =>
      req.body.type === SMS_CAMPAIGN_TYPE.NOT_STAYING &&
      req.body.recipientMode !== 'ANY_DEVOTEE'
    )
    .isArray({ min: 1 })
    .withMessage('Select at least one non-staying devotee.'),
  body('recipientMode')
    .optional()
    .isIn(['ANY_DEVOTEE'])
    .withMessage('Invalid recipient mode.'),
  body('registrationIds')
    .if(body('recipientMode').equals('ANY_DEVOTEE'))
    .isArray({ min: 1 })
    .withMessage('Select at least one devotee for Any Devotee mode.'),
  body('registrationIds')
    .optional({ nullable: true })
    .isArray()
    .withMessage('registrationIds must be an array of ids.'),
  body('registrationIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each registration id must be a positive integer.'),
  body('channel')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(values(MESSAGE_CHANNEL))
    .withMessage('Invalid message channel.'),
];

const listCampaignRules = [
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  query('type').optional({ checkFalsy: true }).isIn(values(SMS_CAMPAIGN_TYPE)),
  query('channel').optional({ checkFalsy: true }).isIn(values(MESSAGE_CHANNEL)),
];

const campaignIdParam = [
  param('campaignId').isInt({ min: 1 }).withMessage('Invalid campaign id.'),
];

module.exports = {
  sendCampaignRules,
  listCampaignRules,
  campaignIdParam,
};
