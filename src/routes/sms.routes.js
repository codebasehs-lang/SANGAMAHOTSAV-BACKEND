const { Router } = require('express');
const smsController = require('../controllers/sms.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin } = require('../middleware/auth');
const {
  sendCampaignRules,
  listCampaignRules,
  campaignIdParam,
} = require('../validators/sms.validator');

const router = Router();

// All SMS routes are admin-only
router.use(authGuard, requireAdmin);

router.post(
  '/campaigns',
  validate(sendCampaignRules),
  smsController.sendCampaign
);
router.get(
  '/campaigns',
  validate(listCampaignRules),
  smsController.listCampaigns
);
router.get(
  '/campaigns/:campaignId/logs',
  validate(campaignIdParam),
  smsController.listLogs
);

module.exports = router;
