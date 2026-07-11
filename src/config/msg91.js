const env = require('./env');

/**
 * MSG91 configuration derived from environment.
 * `enabled` is false when no auth key is present — the client then
 * runs in mock mode so the flow is fully testable in local/dev
 * environments without sending real SMS.
 */
module.exports = {
  authKey: env.msg91.authKey,
  senderId: env.msg91.senderId,
  templateId: env.msg91.templateId,
  route: env.msg91.route,
  baseUrl: 'https://control.msg91.com/api/v5',
  enabled: Boolean(env.msg91.authKey),
};
