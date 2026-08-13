const {
  Registration,
  AccommodationAssignment,
  SmsLog,
  Feedback,
} = require('../models');
const { Sequelize } = require('sequelize');
const {
  ACCOMMODATION_STATUS,
  ASSIGNMENT_STATUS,
  SMS_LOG_STATUS,
  PAYMENT_STATUS,
  DEVOTEE_CATEGORY,
} = require('../constants/enums');

/**
 * Aggregate counts for the admin dashboard cards.
 * Each metric is a lightweight COUNT query.
 */
class DashboardRepository {
  totalRegistrations() {
    return Registration.count();
  }

  discipleRegistrations() {
    return Registration.count({
      where: { devotee_category: DEVOTEE_CATEGORY.DISCIPLE },
    });
  }

  nonDiscipleRegistrations() {
    return Registration.count({
      where: { devotee_category: DEVOTEE_CATEGORY.NON_DISCIPLE },
    });
  }

  brahmachariRegistrations() {
    return Registration.count({
      where: { devotee_category: DEVOTEE_CATEGORY.BRAHMACHARI },
    });
  }

  /** Devotees who need a room (anything not explicitly NOT_REQUIRED). */
  devoteesRequiringStay() {
    return Registration.count({
      where: {
        accommodation_status: [
          ACCOMMODATION_STATUS.PENDING,
          ACCOMMODATION_STATUS.ASSIGNED,
        ],
      },
    });
  }

  assignedRooms() {
    return AccommodationAssignment.count({
      where: { status: ASSIGNMENT_STATUS.ASSIGNED },
    });
  }

  pendingAssignments() {
    return Registration.count({
      where: { accommodation_status: ACCOMMODATION_STATUS.PENDING },
    });
  }

  paymentsNeedingApproval() {
    return Registration.count({
      where: { payment_status: PAYMENT_STATUS.PENDING },
    });
  }

  async totalAmountReceived() {
    const result = await Registration.sum('amount_paid', {
      where: { payment_status: PAYMENT_STATUS.APPROVED },
    });
    return result || 0;
  }

  smsSent() {
    return SmsLog.count({ where: { status: SMS_LOG_STATUS.SENT } });
  }

  feedbackReceived() {
    return Feedback.count();
  }

  /** Returns { totalAttendees, totalAdults, totalChildren } across all registrations + their family members. */
  async attendeeCounts() {
    const rows = await Registration.findAll({
      attributes: ['age', 'familyMembers'],
      raw: true,
    });

    let totalAttendees = 0;
    let totalAdults = 0;
    let totalChildren = 0;

    for (const r of rows) {
      const mainAge = Number(r.age) || 0;
      const members = Array.isArray(r.familyMembers) ? r.familyMembers : [];

      // Main registrant
      totalAttendees += 1;
      if (mainAge >= 18) totalAdults += 1;
      else totalChildren += 1;

      // Family members
      for (const m of members) {
        if (!m.name) continue;
        const age = Number(m.age) || 0;
        totalAttendees += 1;
        if (age >= 18) totalAdults += 1;
        else totalChildren += 1;
      }
    }

    return { totalAttendees, totalAdults, totalChildren };
  }
}

module.exports = new DashboardRepository();
