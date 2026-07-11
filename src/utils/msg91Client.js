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
    logger.warn('MSG91 not configured — running in mock mode', {
      mobileNumber,
    });
    return {
      success: true,
      providerMessageId: `MOCK-${Date.now()}`,
      error: null,
      mocked: true,
    };
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

/** Ensures a country code prefix (defaults to India 91). */
function normalizeMobile(mobile) {
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

module.exports = { sendSms, normalizeMobile };
