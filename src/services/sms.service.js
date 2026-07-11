const smsRepository = require('../repositories/sms.repository');
const seminarHallService = require('./seminarHall.service');
const { sendSms } = require('../utils/msg91Client');
const { TEMPLATES, renderTemplate } = require('../constants/smsTemplates');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const {
  SMS_CAMPAIGN_TYPE,
  SMS_CAMPAIGN_STATUS,
  SMS_LOG_STATUS,
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
  async sendCampaign({ type, registrationIds, message }, adminId) {
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
      const variables = this._buildVariables(registration, activeHall);

      // eslint-disable-next-line no-await-in-loop
      const result = await sendSms({
        mobileNumber: registration.mobileNumber,
        message,
        variables,
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

    logger.info('SMS campaign completed', {
      campaignId: campaign.id,
      type,
      sentCount,
      failedCount,
    });

    return {
      campaignId: campaign.id,
      type,
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

  /** Fills template tokens from a registration + active hall. */
  _render(template, registration, hall) {
    const assignment = registration.assignment || {};
    return renderTemplate(template, {
      name: registration.initiatedName || registration.name,
      hotelName: assignment.hotelName || '',
      hotelAddress: assignment.hotelAddress || '',
      roomNumber: assignment.roomNumber || '',
      hotelMap: assignment.hotelMapLink || '',
      hallName: hall ? hall.hallName : '',
      hallAddress: hall ? hall.hallAddress : '',
      hallMap: hall ? hall.hallMapLink : '',
    });
  }

  /**
   * Maps a registration + active seminar hall to the MSG91 DLT
   * template variables (##var1## .. ##var7##):
   *   var1 = devotee name
   *   var2 = assigned hotel name
   *   var3 = assigned hotel address
   *   var4 = assigned room number
   *   var5 = assigned hotel Google Map link
   *   var6 = active seminar hall name + address
   *   var7 = active seminar hall Google Map link
   */
  _buildVariables(registration, hall) {
    const assignment = registration.assignment || {};
    const seminarHall = hall
      ? [hall.hallName, hall.hallAddress].filter(Boolean).join(', ')
      : '';
    return {
      var1: registration.initiatedName || registration.name || '',
      var2: assignment.hotelName || '',
      var3: assignment.hotelAddress || '',
      var4: assignment.roomNumber || '',
      var5: assignment.hotelMapLink || '',
      var6: seminarHall,
      var7: hall ? hall.hallMapLink || '' : '',
    };
  }
}

module.exports = new SmsService();
