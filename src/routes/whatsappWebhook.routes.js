const { Router } = require('express');
const whatsappWebhookController = require('../controllers/whatsappWebhook.controller');

const router = Router();

router.get('/', whatsappWebhookController.verify);
router.post('/', whatsappWebhookController.receive);

module.exports = router;
