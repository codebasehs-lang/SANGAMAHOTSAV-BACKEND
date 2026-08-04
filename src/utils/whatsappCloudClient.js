const crypto = require('crypto');
const env = require('../config/env');
const logger = require('./logger');

const WEBHOOK_MODE_SUBSCRIBE = 'subscribe';

async function sendWhatsapp({ mobileNumber, message, templateName, components }) {
  if (!env.whatsapp.accessToken || !env.whatsapp.phoneNumberId) {
    return {
      success: false,
      providerMessageId: null,
      error:
        'WhatsApp Cloud API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
    };
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: normalizeMobile(mobileNumber),
  };

  if (templateName) {
    payload.type = 'template';
    payload.template = {
      name: templateName,
      language: { code: env.whatsapp.languageCode },
      ...(Array.isArray(components) && components.length ? { components } : {}),
    };
  } else {
    payload.type = 'text';
    payload.text = {
      preview_url: false,
      body: message,
    };
  }

  try {
    logger.info('Sending WhatsApp Cloud API request', {
      phoneNumberId: env.whatsapp.phoneNumberId,
      apiVersion: env.whatsapp.apiVersion,
      mobileNumber: payload.to,
      messageType: payload.type,
      templateName: payload.template?.name || null,
      templateLanguage: payload.template?.language?.code || null,
      templateComponents: payload.template?.components || [],
      requestPayload: payload,
    });

    const response = await fetch(
      `${env.whatsapp.graphBaseUrl}/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.whatsapp.accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const resPayload = await response.json().catch(() => ({}));

    logger.info('WhatsApp Cloud API raw response', {
      status: response.status,
      ok: response.ok,
      response: resPayload,
    });

    if (!response.ok) {
      logger.warn('WhatsApp Cloud API request failed', {
        status: response.status,
        response: resPayload,
        requestTemplateName: payload.template?.name || null,
        requestTemplateComponents: payload.template?.components || [],
      });

      const errMsg =
        resPayload.error?.message ||
        resPayload.message ||
        JSON.stringify(resPayload) ||
        `HTTP ${response.status}`;
      return {
        success: false,
        providerMessageId: null,
        error: `WhatsApp Cloud API error (HTTP ${response.status}): ${errMsg}`,
      };
    }

    return {
      success: true,
      providerMessageId: resPayload.messages?.[0]?.id || null,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      providerMessageId: null,
      error: err.message,
    };
  }
}

function verifyWebhookSubscription(query) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode !== WEBHOOK_MODE_SUBSCRIBE) {
    return { ok: false, status: 400, body: 'Invalid hub.mode' };
  }

  if (!env.whatsapp.webhookVerifyToken) {
    return {
      ok: false,
      status: 500,
      body: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured on server.',
    };
  }

  if (token !== env.whatsapp.webhookVerifyToken) {
    return { ok: false, status: 403, body: 'Verification token mismatch.' };
  }

  return { ok: true, status: 200, body: challenge };
}

function verifyWebhookSignature(signatureHeader, rawBody) {
  if (!env.whatsapp.appSecret) {
    return { ok: true };
  }

  if (!signatureHeader || !rawBody) {
    return { ok: false, reason: 'Missing signature header or raw body.' };
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', env.whatsapp.appSecret)
    .update(rawBody)
    .digest('hex')}`;

  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
    return valid ? { ok: true } : { ok: false, reason: 'Signature mismatch.' };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

function normalizeMobile(mobile) {
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

module.exports = {
  sendWhatsapp,
  verifyWebhookSubscription,
  verifyWebhookSignature,
  normalizeMobile,
};
