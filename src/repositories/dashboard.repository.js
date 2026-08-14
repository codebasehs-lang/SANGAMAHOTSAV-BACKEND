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
} = require('../constants/enums'); // BRAHMACHARI kept in enum for existing data

/**
 * Aggregate counts for the admin dashboard cards.
 * Each metric is a lightweight COUNT query.
 */
class DashboardRepository {
  totalRegistrations() {
    return Registration.count();
  }

  async categoryBreakdown() {
    const rows = await Registration.findAll({
      attributes: ['devoteeCategory', 'gender', 'familyMembers'],
      raw: true,
    });

    const counts = {
      [DEVOTEE_CATEGORY.DISCIPLE]: 0,
      [DEVOTEE_CATEGORY.NON_DISCIPLE]: 0,
      [DEVOTEE_CATEGORY.BRAHMACHARI]: 0,
      [DEVOTEE_CATEGORY.ASPIRING]: 0,
      [DEVOTEE_CATEGORY.FOLLOWER]: 0,
    };

    for (const row of rows) {
      const mainCategory = row.devoteeCategory;
      const familyMembers = Array.isArray(row.familyMembers) ? row.familyMembers : [];

      if (mainCategory && counts[mainCategory] !== undefined) {
        counts[mainCategory] += 1;
      }

      for (const member of familyMembers) {
        const memberCategory = member?.devoteeCategory || mainCategory;

        if (memberCategory && counts[memberCategory] !== undefined) {
          counts[memberCategory] += 1;
        }
      }
    }

    return counts;
  }

  async attendeeCounts() {
    const rows = await Registration.findAll({
      attributes: ['age', 'gender', 'familyMembers'],
      raw: true,
    });

    let totalAttendees = 0;
    let totalAdults = 0;
    let totalChildren = 0;
    let maleCount = 0;
    let femaleCount = 0;

    const addPerson = (age, gender) => {
      const numericAge = Number(age) || 0;
      totalAttendees += 1;
      if (numericAge >= 18) totalAdults += 1;
      else totalChildren += 1;

      const normalizedGender = String(gender || '').trim().toUpperCase();
      if (normalizedGender === 'MALE') maleCount += 1;
      else if (normalizedGender === 'FEMALE') femaleCount += 1;
    };

    for (const row of rows) {
      addPerson(row.age, row.gender);

      const familyMembers = Array.isArray(row.familyMembers) ? row.familyMembers : [];
      for (const member of familyMembers) {
        if (!member || !member.name) continue; // skip empty slots
        addPerson(member.age, member.gender); // use member's own gender only
      }
    }

    return {
      totalAttendees,
      totalAdults,
      totalChildren,
      maleCount,
      femaleCount,
    };
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

  nonAttendingCount() {
    return Registration.count({ where: { non_attending_type: 'NON_ATTENDING' } });
  }

  attendingNotStayingCount() {
    return Registration.count({ where: { non_attending_type: 'ATTENDING_NOT_STAYING' } });
  }

  feedbackReceived() {
    return Feedback.count();
  }

}

module.exports = new DashboardRepository();
