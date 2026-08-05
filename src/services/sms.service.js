const smsRepository = require('../repositories/sms.repository');
const seminarHallService = require('./seminarHall.service');
const { sendWhatsapp } = require('../utils/whatsappCloudClient');
const env = require('../config/env');
const { TEMPLATES, renderTemplate } = require('../constants/smsTemplates');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const {
  SMS_CAMPAIGN_TYPE,
  SMS_CAMPAIGN_STATUS,
  SMS_LOG_STATUS,
  MESSAGE_CHANNEL,
} = require('../constants/enums');

/**
 * SMS campaign orchestration:
 *   1. Resolve recipients (+ their assignments) and the active hall.
 *   2. Create a campaign record (snapshotting the template).
 *   3. Render + send per recipient, logging each result.
 *   4. Update the campaign summary (sent/failed/status).
 *
 * Admin-triggered only; no scheduling in V1.
 */
class SmsService {
  async sendCampaign({ type, registrationIds, message, channel }, adminId) {
    const selectedChannel = channel || MESSAGE_CHANNEL.WHATSAPP;

    if (selectedChannel === MESSAGE_CHANNEL.APPLICATION) {
      if (!message || !message.trim()) {
        throw ApiError.badRequest(
          'Message is required for Application channel.'
        );
      }

      const activeHall = await seminarHallService.getActive();
      const campaign = await smsRepository.createCampaign({
        type,
        channel: selectedChannel,
        messageTemplate: message.trim(),
        seminarHallId: activeHall ? activeHall.id : null,
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
        status: SMS_CAMPAIGN_STATUS.COMPLETED,
        triggeredBy: adminId,
      });

      logger.info('Application notice created', {
        campaignId: campaign.id,
        type,
        channel: selectedChannel,
      });

      return {
        campaignId: campaign.id,
        type,
        channel: selectedChannel,
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
        status: SMS_CAMPAIGN_STATUS.COMPLETED,
      };
    }

    let template;
    if (type === SMS_CAMPAIGN_TYPE.CUSTOM) {
      if (!message || !message.trim()) {
        throw ApiError.badRequest('Message is required for a custom campaign.');
      }
      template = message.trim();
    } else {
      template = TEMPLATES[type];
      if (!template) throw ApiError.badRequest('Unknown SMS campaign type.');
    }

    const activeHall = await seminarHallService.getActive();

    const recipients =
      Array.isArray(registrationIds) && registrationIds.length > 0
        ? await smsRepository.findRecipients(registrationIds)
        : await smsRepository.findAllRecipients();

    if (recipients.length === 0) {
      throw ApiError.badRequest('No recipients found for this campaign.');
    }

    // Accommodation SMS requires an assignment; skip those without one.
    const eligible =
      type === SMS_CAMPAIGN_TYPE.ACCOMMODATION
        ? recipients.filter((r) => r.assignment)
        : recipients;

    if (eligible.length === 0) {
      throw ApiError.badRequest(
        'No recipients have an accommodation assignment yet.'
      );
    }

    const campaign = await smsRepository.createCampaign({
      type,
      channel: selectedChannel,
      messageTemplate: template,
      seminarHallId: activeHall ? activeHall.id : null,
      totalRecipients: eligible.length,
      status: SMS_CAMPAIGN_STATUS.PROCESSING,
      triggeredBy: adminId,
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const registration of eligible) {
      const message = this._render(template, registration, activeHall);
      const whatsappTemplateName = env.whatsapp.defaultTemplateName || null;
      const whatsappComponents = whatsappTemplateName
        ? this._buildTemplateComponents(
            template,
            this._getTemplateData(registration, activeHall)
          )
        : null;
      // eslint-disable-next-line no-await-in-loop
      if (selectedChannel === MESSAGE_CHANNEL.SMS) {
        throw ApiError.badRequest(
          'SMS channel is no longer supported in this build. Use WHATSAPP channel with Meta Cloud API.'
        );
      }

      const result = await sendWhatsapp({
        mobileNumber: registration.mobileNumber,
        message,
        ...(whatsappTemplateName ? { templateName: whatsappTemplateName } : {}),
        ...(whatsappComponents ? { components: whatsappComponents } : {}),
      });

      // eslint-disable-next-line no-await-in-loop
      await smsRepository.createLog({
        campaignId: campaign.id,
        registrationId: registration.id,
        mobileNumber: registration.mobileNumber,
        renderedMessage: message,
        status: result.success ? SMS_LOG_STATUS.SENT : SMS_LOG_STATUS.FAILED,
        providerMessageId: result.providerMessageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
      });

      if (result.success) sentCount += 1;
      else failedCount += 1;
    }

    const status =
      failedCount === 0
        ? SMS_CAMPAIGN_STATUS.COMPLETED
        : sentCount === 0
        ? SMS_CAMPAIGN_STATUS.FAILED
        : SMS_CAMPAIGN_STATUS.COMPLETED;

    await smsRepository.updateCampaign(campaign.id, {
      sentCount,
      failedCount,
      status,
    });

    logger.info('Message campaign completed', {
      campaignId: campaign.id,
      type,
      channel: selectedChannel,
      sentCount,
      failedCount,
    });

    return {
      campaignId: campaign.id,
      type,
      channel: selectedChannel,
      totalRecipients: eligible.length,
      sentCount,
      failedCount,
      status,
    };
  }

  async listCampaigns(query) {
    const { page, limit, offset } = getPagination(query);
    const where = {};
    if (query.type) where.type = query.type;
    if (query.channel) where.channel = query.channel;

    const { rows, count } = await smsRepository.findCampaigns({
      limit,
      offset,
      where,
      order: [['created_at', 'DESC']],
    });
    return { data: rows, meta: buildMeta({ count, page, limit }) };
  }

  async listLogs(campaignId, query) {
    const campaign = await smsRepository.findCampaignById(campaignId);
    if (!campaign) throw ApiError.notFound('Campaign not found.');

    const { page, limit, offset } = getPagination(query);
    const { rows, count } = await smsRepository.findLogsByCampaign(campaignId, {
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
    return { data: rows, meta: buildMeta({ count, page, limit }) };
  }

  /**
   * Sends a single payment-confirmed SMS to a devotee immediately after
   * payment approval. Creates a lightweight campaign record so the send
   * is fully auditable in the SMS logs.
   */
  async sendPaymentConfirmation(registration, adminId) {
    const template = TEMPLATES[SMS_CAMPAIGN_TYPE.PAYMENT_CONFIRMED];
    const devoteeName = registration.initiatedName || registration.name || '';
    const templateData = { name: devoteeName };
    const templatePlaceholders = this._getTemplateTokens(template);
    const renderedMessage = renderTemplate(template, templateData);

    const campaign = await smsRepository.createCampaign({
      type: SMS_CAMPAIGN_TYPE.PAYMENT_CONFIRMED,
      channel: MESSAGE_CHANNEL.WHATSAPP,
      messageTemplate: template,
      seminarHallId: null,
      totalRecipients: 1,
      status: SMS_CAMPAIGN_STATUS.PROCESSING,
      triggeredBy: adminId,
    });

    const paymentTemplateName =
      env.whatsapp.paymentTemplateName || env.whatsapp.defaultTemplateName || null;

    const templateComponents = paymentTemplateName
      ? this._buildTemplateComponents(template, templateData)
      : null;

    logger.info('Payment confirmation WhatsApp payload prepared', {
      registrationId: registration.id,
      mobileNumber: registration.mobileNumber,
      adminId,
      template,
      paymentTemplateName,
      languageCode: env.whatsapp.languageCode,
      whatsappGraphBaseUrl: env.whatsapp.graphBaseUrl,
      whatsappApiVersion: env.whatsapp.apiVersion,
      whatsappPhoneNumberId: env.whatsapp.phoneNumberId,
      whatsappBusinessAccountId: env.whatsapp.businessAccountId,
      whatsappAccessTokenConfigured: Boolean(env.whatsapp.accessToken),
      whatsappAppSecretConfigured: Boolean(env.whatsapp.appSecret),
      whatsappWebhookVerifyTokenConfigured: Boolean(env.whatsapp.webhookVerifyToken),
      templatePlaceholders,
      templateBodyParameterCount: templateComponents?.[0]?.parameters?.length || 0,
      templateBodyParams: templateComponents?.[0]?.parameters?.map((param) => param.text) || [],
      renderedMessage,
    });

    const result = await sendWhatsapp({
      mobileNumber: registration.mobileNumber,
      message: renderedMessage,
      ...(paymentTemplateName ? { templateName: paymentTemplateName } : {}),
      ...(templateComponents ? { components: templateComponents } : {}),
    });

    await smsRepository.createLog({
      campaignId: campaign.id,
      registrationId: registration.id,
      mobileNumber: registration.mobileNumber,
      renderedMessage,
      status: result.success ? SMS_LOG_STATUS.SENT : SMS_LOG_STATUS.FAILED,
      providerMessageId: result.providerMessageId,
      errorMessage: result.error,
      sentAt: result.success ? new Date() : null,
    });

    await smsRepository.updateCampaign(campaign.id, {
      sentCount: result.success ? 1 : 0,
      failedCount: result.success ? 0 : 1,
      status: result.success ? SMS_CAMPAIGN_STATUS.COMPLETED : SMS_CAMPAIGN_STATUS.FAILED,
    });

    logger.info('Payment confirmation WhatsApp sent', {
      registrationId: registration.id,
      mobileNumber: registration.mobileNumber,
      success: result.success,
    });
    if (!result.success) {
      logger.warn('Payment confirmation WhatsApp failed', {
        registrationId: registration.id,
        mobileNumber: registration.mobileNumber,
        error: result.error,
      });
    }
  }

  /** Fills template tokens from a registration + active hall. */
  _render(template, registration, hall) {
    return renderTemplate(template, this._getTemplateData(registration, hall));
  }

  /** Builds the token map used for rendering WhatsApp/SMS campaign templates. */
  _getTemplateData(registration, hall) {
    const assignment = registration.assignment || {};
    return {
      name: registration.initiatedName || registration.name,
      hotelName: assignment.hotelName || '',
      hotelAddress: assignment.hotelAddress || '',
      roomNumber: assignment.roomNumber || '',
      hotelMap: assignment.hotelMapLink || '',
      hallName: hall ? hall.hallName : '',
      hallAddress: hall ? hall.hallAddress : '',
      hallMap: hall ? hall.hallMapLink : '',
    };
  }

  /** Extracts unique placeholder token names from a template string. */
  _getTemplateTokens(template) {
    return Array.from(
      new Set(
        (template.match(/\{\{\s*(\w+)\s*\}\}/g) || []).map((token) =>
          token.replace(/[{}\s]/g, '')
        )
      )
    );
  }

  /**
   * Builds WhatsApp template body components in the same format used by
   * payment confirmation sends.
   */
  _buildTemplateComponents(template, templateData = {}) {
    const tokens = this._getTemplateTokens(template);
    if (tokens.length === 0) return null;

    return [
      {
        type: 'body',
        parameters: tokens.map((token) => ({
          type: 'text',
          text: templateData[token] != null ? String(templateData[token]) : '',
          parameter_name: token,
        })),
      },
    ];
  }

}

module.exports = new SmsService();
