const { body, param, query } = require('express-validator');
const { SMS_CAMPAIGN_TYPE, values } = require('../constants/enums');

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
    .optional({ nullable: true })
    .isArray()
    .withMessage('registrationIds must be an array of ids.'),
  body('registrationIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each registration id must be a positive integer.'),
];

const listCampaignRules = [
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  query('type').optional({ checkFalsy: true }).isIn(values(SMS_CAMPAIGN_TYPE)),
];

const campaignIdParam = [
  param('campaignId').isInt({ min: 1 }).withMessage('Invalid campaign id.'),
];

module.exports = { sendCampaignRules, listCampaignRules, campaignIdParam };
