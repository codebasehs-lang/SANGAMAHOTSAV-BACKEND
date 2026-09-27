const {
  SmsCampaign,
  SmsLog,
  Registration,
  AccommodationAssignment,
} = require('../models');
const {
  MESSAGE_CHANNEL,
  SMS_CAMPAIGN_STATUS,
  NON_ATTENDING_TYPE,
} = require('../constants/enums');
const { Op } = require('sequelize');

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

  /**
   * Any registration with at least one donation item — mirrors the
   * Donations admin page, which does not filter by attendance or
   * payment status.
   */
  async findDonationOnlyRecipients(ids) {
    const where = { donationItems: { [Op.ne]: null } };
    if (ids) where.id = { [Op.in]: ids };

    const registrations = await Registration.findAll({
      where,
      attributes: ['id', 'name', 'initiatedName', 'mobileNumber', 'donationItems'],
    });

    return registrations.filter(
      (registration) =>
        Array.isArray(registration.donationItems) &&
        registration.donationItems.length > 0
    );
  }

  /**
   * Any registration marked "Attending but not staying" — regardless of
   * payment status, mirroring how the donation list is now fetched.
   */
  findNotStayingRecipients(ids) {
    const where = {
      non_attending_type: NON_ATTENDING_TYPE.ATTENDING_NOT_STAYING,
    };
    if (ids) where.id = { [Op.in]: ids };

    return Registration.findAll({
      where,
      attributes: ['id', 'name', 'initiatedName', 'mobileNumber'],
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
