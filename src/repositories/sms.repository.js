const {
  SmsCampaign,
  SmsLog,
  Registration,
  AccommodationAssignment,
} = require('../models');

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
}

module.exports = new SmsRepository();
