const msg91Config = require('../config/msg91');
const logger = require('./logger');

/**
 * Thin MSG91 client. Sends a single SMS and returns a normalized result:
 *   { success, providerMessageId, error }
 *
 * When MSG91 is not configured (no auth key), it runs in mock mode so
 * the campaign pipeline can be exercised end-to-end in development
 * without dispatching real messages.
 */
async function sendSms({ mobileNumber, message, variables }) {
  if (!msg91Config.enabled) {
    logger.warn('MSG91 SMS not configured, running in mock mode', { mobileNumber });
    return mockSendResult();
  }

  try {
    const response = await fetch(`${msg91Config.baseUrl}/flow/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: msg91Config.authKey,
      },
      body: JSON.stringify({
        sender: msg91Config.senderId,
        template_id: msg91Config.templateId,
        short_url: '0',
        recipients: [
          {
            mobiles: normalizeMobile(mobileNumber),
            // DLT flow template variables (##var1## .. ##var7##).
            ...(variables || {}),
            // Fully rendered body kept for text-based templates.
            body: message,
          },
        ],
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.type === 'error') {
      return {
        success: false,
        providerMessageId: null,
        error: payload.message || `MSG91 error (HTTP ${response.status})`,
      };
    }

    return {
      success: true,
      providerMessageId: payload.request_id || payload.messageId || null,
      error: null,
    };
  } catch (err) {
    return { success: false, providerMessageId: null, error: err.message };
  }
}

/**
 * Sends a WhatsApp template message through MSG91.
 *   templateName  — MSG91 template name; defaults to whatsappTemplateId from config.
 *   components    — WhatsApp template components array; defaults to a single body
 *                   parameter containing `message`.
 * Returns { success, providerMessageId, error }.
 */
async function sendWhatsapp({ mobileNumber, message, templateName, components }) {
  if (!msg91Config.whatsappEnabled) {
    logger.warn('MSG91 WhatsApp not configured, running in mock mode', {
      mobileNumber,
    });
    return mockSendResult();
  }

  const resolvedTemplate = templateName || msg91Config.whatsappTemplateId;

  try {
    const response = await fetch(
      `${msg91Config.baseUrl}/whatsapp/whatsapp-outbound-message/bulk/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: msg91Config.authKey,
        },
        body: JSON.stringify({
          integrated_number: msg91Config.whatsappIntegratedNumber,
          content_type: 'template',
          payload: {
            messaging_product: 'whatsapp',
            type: 'template',
            template: {
              name: resolvedTemplate,
              language: { code: 'en' },
              to: [normalizeMobile(mobileNumber)],
            },
          },
        }),
      }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.type === 'error') {
      const errMsg = payload.message || payload.error || JSON.stringify(payload) || `HTTP ${response.status}`;
      logger.warn('MSG91 WhatsApp API error', { status: response.status, body: payload });
      return {
        success: false,
        providerMessageId: null,
        error: `MSG91 WhatsApp error (HTTP ${response.status}): ${errMsg}`,
      };
    }

    return {
      success: true,
      providerMessageId: payload.request_id || payload.id || null,
      error: null,
    };
  } catch (err) {
    return { success: false, providerMessageId: null, error: err.message };
  }
}

function mockSendResult() {
  return {
    success: true,
    providerMessageId: `MOCK-${Date.now()}`,
    error: null,
    mocked: true,
  };
}

/** Ensures a country code prefix (defaults to India 91). */
function normalizeMobile(mobile) {
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

module.exports = { sendSms, sendWhatsapp, normalizeMobile };
