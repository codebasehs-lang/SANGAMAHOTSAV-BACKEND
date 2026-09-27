const smsRepository = require('../repositories/sms.repository');
const seminarHallService = require('./seminarHall.service');
const { sendWhatsapp } = require('../utils/whatsappCloudClient');
const env = require('../config/env');
const {
  TEMPLATES,
  NOT_STAYING_CONFIRMATION_TEMPLATE,
  DONATION_THANK_YOU_TEMPLATE,
  renderTemplate,
} = require('../constants/smsTemplates');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const {
  SMS_CAMPAIGN_TYPE,
  SMS_CAMPAIGN_STATUS,
  SMS_LOG_STATUS,
  MESSAGE_CHANNEL,
  NON_ATTENDING_TYPE,
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
  async sendCampaign({ type, registrationIds, message, channel, recipientMode }, adminId) {
    const selectedChannel = channel || MESSAGE_CHANNEL.WHATSAPP;
    const isDonationCampaign = type === SMS_CAMPAIGN_TYPE.DONATION;
    const isNotStayingCampaign = type === SMS_CAMPAIGN_TYPE.NOT_STAYING;
    const isAnyDevotee = recipientMode === 'ANY_DEVOTEE';

    if (isAnyDevotee && selectedChannel === MESSAGE_CHANNEL.APPLICATION) {
      throw ApiError.badRequest(
        'Application notices are visible to everyone. Choose WhatsApp for Any Devotee mode.'
      );
    }
    if (isAnyDevotee && (!Array.isArray(registrationIds) || registrationIds.length === 0)) {
      throw ApiError.badRequest('Select at least one devotee for Any Devotee mode.');
    }
    if (selectedChannel === MESSAGE_CHANNEL.SMS) {
      throw ApiError.badRequest(
        'SMS channel is no longer supported in this build. Use WHATSAPP channel with Meta Cloud API.'
      );
    }

    if (isDonationCampaign || isNotStayingCampaign) {
      if (selectedChannel !== MESSAGE_CHANNEL.WHATSAPP) {
        throw ApiError.badRequest(
          'This campaign template is only available on WhatsApp.'
        );
      }
      if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
        throw ApiError.badRequest(
          isDonationCampaign
            ? 'Select at least one donor.'
            : 'Select at least one non-staying devotee.'
        );
      }
      if (isDonationCampaign && !env.whatsapp.donationTemplateName) {
        throw ApiError.badRequest(
          'The donation WhatsApp template is not configured.'
        );
      }
      if (isNotStayingCampaign && !env.whatsapp.notStayingTemplateName) {
        throw ApiError.badRequest(
          'The non-staying WhatsApp template is not configured.'
        );
      }
    }

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
    if (isDonationCampaign) {
      template = DONATION_THANK_YOU_TEMPLATE;
    } else if (isNotStayingCampaign) {
      template = NOT_STAYING_CONFIRMATION_TEMPLATE;
    } else if (type === SMS_CAMPAIGN_TYPE.CUSTOM) {
      if (!message || !message.trim()) {
        throw ApiError.badRequest('Message is required for a custom campaign.');
      }
      template = message.trim();
    } else {
      template = TEMPLATES[type];
      if (!template) throw ApiError.badRequest('Unknown SMS campaign type.');
    }

    const activeHall = isDonationCampaign
      ? null
      : await seminarHallService.getActive();
    if (isNotStayingCampaign && (!activeHall || !activeHall.hallMapLink)) {
      throw ApiError.badRequest(
        'An active seminar hall with a map link is required for this WhatsApp template.'
      );
    }

    const recipients = isAnyDevotee
      ? await smsRepository.findRecipients(registrationIds)
      : isDonationCampaign
      ? await smsRepository.findDonationOnlyRecipients(registrationIds)
      : isNotStayingCampaign
      ? await smsRepository.findNotStayingRecipients(registrationIds)
      : Array.isArray(registrationIds) && registrationIds.length > 0
      ? await smsRepository.findRecipients(registrationIds)
      : await smsRepository.findAllRecipients();

    if (recipients.length === 0) {
      throw ApiError.badRequest('No recipients found for this campaign.');
    }
    if (isAnyDevotee && recipients.length !== new Set(registrationIds.map(Number)).size) {
      throw ApiError.badRequest('One or more selected devotees could not be found.');
    }
    if (
      !isAnyDevotee &&
      (isDonationCampaign || isNotStayingCampaign) &&
      recipients.length !== new Set(registrationIds.map(Number)).size
    ) {
      throw ApiError.badRequest(
        isDonationCampaign
          ? 'One or more selected recipients no longer have a donation on record.'
          : 'One or more selected recipients are no longer marked as attending but not staying.'
      );
    }

    // Accommodation SMS requires an assignment; skip those without one.
    const eligible =
      type === SMS_CAMPAIGN_TYPE.ACCOMMODATION && !isAnyDevotee
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
      const templateData = isDonationCampaign
        ? { 1: registration.initiatedName || registration.name }
        : isNotStayingCampaign
        ? {
            1: registration.initiatedName || registration.name,
            2: activeHall.hallName,
            3: activeHall.hallMapLink,
          }
        : this._getTemplateData(registration, activeHall);
      const message = renderTemplate(template, templateData);
      const whatsappTemplateName = isDonationCampaign
        ? env.whatsapp.donationTemplateName
        : isNotStayingCampaign
        ? env.whatsapp.notStayingTemplateName
        : env.whatsapp.defaultTemplateName || null;
      const whatsappComponents = whatsappTemplateName
        ? this._buildTemplateComponents(template, templateData)
        : null;
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

  async listDonationOnlyRecipients() {
    const registrations = await smsRepository.findDonationOnlyRecipients();
    return registrations.map((registration) => ({
      id: registration.id,
      name: registration.initiatedName || registration.name,
      mobileNumber: registration.mobileNumber,
      donationAmount: registration.donationItems.reduce(
        (total, donation) => total + Number(donation.amount || 0),
        0
      ),
    }));
  }

  async listNotStayingRecipients() {
    const registrations = await smsRepository.findNotStayingRecipients();
    return registrations.map((registration) => ({
      id: registration.id,
      name: registration.initiatedName || registration.name,
      mobileNumber: registration.mobileNumber,
    }));
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
    const useNotStayingTemplate =
      registration.nonAttendingType ===
        NON_ATTENDING_TYPE.ATTENDING_NOT_STAYING &&
      Boolean(env.whatsapp.notStayingTemplateName);
    const hall = useNotStayingTemplate
      ? await seminarHallService.getActive()
      : null;
    if (useNotStayingTemplate && (!hall || !hall.hallMapLink)) {
      throw ApiError.badRequest(
        'An active seminar hall with a map link is required for this WhatsApp template.'
      );
    }
    const template = useNotStayingTemplate
      ? NOT_STAYING_CONFIRMATION_TEMPLATE
      : TEMPLATES[SMS_CAMPAIGN_TYPE.PAYMENT_CONFIRMED];
    const devoteeName = registration.initiatedName || registration.name || '';
    let templateData;
    if (useNotStayingTemplate) {
      templateData = {
        1: devoteeName,
        2: hall ? hall.hallName : '',
        3: hall ? hall.hallMapLink || '' : '',
      };
    } else {
      const familyMembers = Array.isArray(registration.familyMembers)
        ? registration.familyMembers.filter((member) => member && member.name)
        : [];
      const accommodation =
        registration.sharedAccommodation || registration.familyAccommodation;
      const accommodationLabels = {
        DORMITORY: 'AC Dormitory',
        NON_AC_SHARING: 'Non AC Sharing',
        AC_SHARING: 'AC Sharing Room',
        DELUXE_AC: 'Deluxe AC Room',
        PREMIUM_AC: 'Premium AC Room',
      };
      const devoteeCount = familyMembers.length + 1;
      templateData = {
        name: devoteeName,
        amount: Number(registration.amountPaid || 0).toLocaleString('en-IN'),
        accommodation: accommodationLabels[accommodation] || 'accommodation',
        devoteeText: `${devoteeCount} ${devoteeCount === 1 ? 'devotee' : 'devotees'}`,
      };
    }
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

    const paymentTemplateName = useNotStayingTemplate
      ? env.whatsapp.notStayingTemplateName
      : env.whatsapp.paymentTemplateName ||
        env.whatsapp.defaultTemplateName ||
        null;

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
   * Builds WhatsApp template body components in the format Meta expects.
   * Meta templates use numbered placeholders like {{1}}, {{2}}, ... or named
   * placeholders depending on the template definition. Parameter values must not
   * contain newline/tab characters or long runs of spaces.
   */
  _buildTemplateComponents(template, templateData = {}) {
    const tokens = this._getTemplateTokens(template);
    if (tokens.length === 0) return null;

    const sanitizeValue = (value) =>
      String(value ?? '')
        .replace(/\r?\n|\t/g, ' ')
        .replace(/\s{5,}/g, ' ')
        .trim();

    const hasNumberedPlaceholders = tokens.every((token) => /^\d+$/.test(token));
    const parameters = tokens.map((token) => {
      const text = sanitizeValue(templateData[token]);
      return hasNumberedPlaceholders
        ? { type: 'text', text }
        : { type: 'text', text, parameter_name: token };
    });

    return [{ type: 'body', parameters }];
  }

}

module.exports = new SmsService();
