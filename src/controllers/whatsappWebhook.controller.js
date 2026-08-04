const asyncHandler = require('../utils/asyncHandler');
const {
  verifyWebhookSubscription,
  verifyWebhookSignature,
} = require('../utils/whatsappCloudClient');
const whatsappWebhookService = require('../services/whatsappWebhook.service');
const logger = require('../utils/logger');

class WhatsappWebhookController {
  verify = asyncHandler(async (req, res) => {
    const result = verifyWebhookSubscription(req.query);
    return res.status(result.status).send(result.body);
  });

  receive = asyncHandler(async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const verify = verifyWebhookSignature(signature, req.rawBody);

    if (!verify.ok) {
      logger.warn('WhatsApp webhook signature verification failed', {
        reason: verify.reason,
      });
      return res.status(401).json({ success: false, message: 'Invalid signature.' });
    }

    await whatsappWebhookService.processPayload(req.body);
    return res.status(200).json({ success: true });
  });
}

module.exports = new WhatsappWebhookController();
