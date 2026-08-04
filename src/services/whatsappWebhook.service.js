const smsRepository = require('../repositories/sms.repository');
const logger = require('../utils/logger');
const { SMS_LOG_STATUS } = require('../constants/enums');

const STATUS_TO_LOG = {
  sent: SMS_LOG_STATUS.SENT,
  delivered: SMS_LOG_STATUS.SENT,
  read: SMS_LOG_STATUS.SENT,
  failed: SMS_LOG_STATUS.FAILED,
};

class WhatsappWebhookService {
  async processPayload(payload) {
    if (!payload || payload.object !== 'whatsapp_business_account') {
      return { processed: 0 };
    }

    let processed = 0;

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const statuses = change?.value?.statuses || [];
        for (const statusItem of statuses) {
          const providerMessageId = statusItem.id;
          const mappedStatus = STATUS_TO_LOG[String(statusItem.status || '').toLowerCase()];
          if (!providerMessageId || !mappedStatus) continue;

          const errorMessage = Array.isArray(statusItem.errors)
            ? statusItem.errors.map((e) => e.title || e.message).filter(Boolean).join('; ')
            : null;

          await smsRepository.updateLogByProviderMessageId(providerMessageId, {
            status: mappedStatus,
            ...(mappedStatus === SMS_LOG_STATUS.SENT ? { sentAt: new Date() } : {}),
            ...(errorMessage ? { errorMessage } : {}),
          });
          processed += 1;
        }
      }
    }

    logger.info('WhatsApp webhook processed', { processed });
    return { processed };
  }
}

module.exports = new WhatsappWebhookService();
