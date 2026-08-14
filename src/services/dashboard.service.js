const dashboardRepository = require('../repositories/dashboard.repository');
const { DEVOTEE_CATEGORY } = require('../constants/enums');

/**
 * Assembles the dashboard summary. Counts run in parallel since
 * they are independent read-only queries.
 */
class DashboardService {
  async getSummary() {
    const [
      totalRegistrations,
      categoryBreakdown,
      devoteesRequiringStay,
      assignedRooms,
      pendingAssignments,
      paymentsNeedingApproval,
      totalAmountReceived,
      smsSent,
      feedbackReceived,
      attendeeCounts,
      nonAttendingCount,
      attendingNotStayingCount,
    ] = await Promise.all([
      dashboardRepository.totalRegistrations(),
      dashboardRepository.categoryBreakdown(),
      dashboardRepository.devoteesRequiringStay(),
      dashboardRepository.assignedRooms(),
      dashboardRepository.pendingAssignments(),
      dashboardRepository.paymentsNeedingApproval(),
      dashboardRepository.totalAmountReceived(),
      dashboardRepository.smsSent(),
      dashboardRepository.feedbackReceived(),
      dashboardRepository.attendeeCounts(),
      dashboardRepository.nonAttendingCount(),
      dashboardRepository.attendingNotStayingCount(),
    ]);

    return {
      totalRegistrations,
      discipleRegistrations: categoryBreakdown[DEVOTEE_CATEGORY.DISCIPLE] ?? 0,
      nonDiscipleRegistrations: categoryBreakdown[DEVOTEE_CATEGORY.NON_DISCIPLE] ?? 0,
      brahmachariRegistrations: categoryBreakdown[DEVOTEE_CATEGORY.BRAHMACHARI] ?? 0,
      aspiringRegistrations: categoryBreakdown[DEVOTEE_CATEGORY.ASPIRING] ?? 0,
      followerRegistrations: categoryBreakdown[DEVOTEE_CATEGORY.FOLLOWER] ?? 0,
      nonAttendingCount,
      attendingNotStayingCount,
      devoteesRequiringStay,
      assignedRooms,
      pendingAssignments,
      paymentsNeedingApproval,
      totalAmountReceived,
      smsSent,
      feedbackReceived,
      totalAttendees: attendeeCounts.totalAttendees,
      totalAdults: attendeeCounts.totalAdults,
      totalChildren: attendeeCounts.totalChildren,
      maleCount: attendeeCounts.maleCount,
      femaleCount: attendeeCounts.femaleCount,
    };
  }
}

module.exports = new DashboardService();
