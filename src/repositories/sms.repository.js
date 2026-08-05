const {
  SmsCampaign,
  SmsLog,
  Registration,
  AccommodationAssignment,
} = require('../models');
const { MESSAGE_CHANNEL, SMS_CAMPAIGN_STATUS } = require('../constants/enums');

/**
 * Data-access layer for SMS campaigns and logs.
 */
class SmsRepository {
  createCampaign(data, options = {}) {
    return SmsCampaign.create(data, options);
  }

  updateCampaign(id, data, options = {}) {
    return SmsCampaign.update(data, { where: { id }, ...options });
  }

  createLog(data, options = {}) {
    return SmsLog.create(data, options);
  }

  updateLogByProviderMessageId(providerMessageId, data, options = {}) {
    return SmsLog.update(data, {
      where: { providerMessageId },
      ...options,
    });
  }

  findCampaignById(id) {
    return SmsCampaign.findByPk(id);
  }

  findCampaigns({ limit, offset, where, order }) {
    return SmsCampaign.findAndCountAll({ where, limit, offset, order });
  }

  findLogsByCampaign(campaignId, { limit, offset, order }) {
    return SmsLog.findAndCountAll({
      where: { campaign_id: campaignId },
      limit,
      offset,
      order,
    });
  }

  /** Load registrations (with assignment) for the given ids. */
  findRecipients(ids) {
    return Registration.findAll({
      where: { id: ids },
      include: [{ model: AccommodationAssignment, as: 'assignment' }],
    });
  }

  /** Load all registrations (with assignment) — used for broadcast reminders. */
  findAllRecipients() {
    return Registration.findAll({
      include: [{ model: AccommodationAssignment, as: 'assignment' }],
    });
  }

  /** Recent Application-channel messages — shown in registrant notice board. */
  findNoticeBoardMessages({ limit = 5 } = {}) {
    return SmsCampaign.findAll({
      where: {
        channel: MESSAGE_CHANNEL.APPLICATION,
        status: SMS_CAMPAIGN_STATUS.COMPLETED,
      },
      attributes: ['id', 'messageTemplate', 'createdAt'],
      order: [['created_at', 'DESC']],
      limit,
    });
  }
}

module.exports = new SmsRepository();
