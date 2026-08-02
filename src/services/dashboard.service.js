const dashboardRepository = require('../repositories/dashboard.repository');

/**
 * Assembles the dashboard summary. Counts run in parallel since
 * they are independent read-only queries.
 */
class DashboardService {
  async getSummary() {
    const [
      totalRegistrations,
      discipleRegistrations,
      nonDiscipleRegistrations,
      devoteesRequiringStay,
      assignedRooms,
      pendingAssignments,
      paymentsNeedingApproval,
      totalAmountReceived,
      smsSent,
      feedbackReceived,
      attendeeCounts,
    ] = await Promise.all([
      dashboardRepository.totalRegistrations(),
      dashboardRepository.discipleRegistrations(),
      dashboardRepository.nonDiscipleRegistrations(),
      dashboardRepository.devoteesRequiringStay(),
      dashboardRepository.assignedRooms(),
      dashboardRepository.pendingAssignments(),
      dashboardRepository.paymentsNeedingApproval(),
      dashboardRepository.totalAmountReceived(),
      dashboardRepository.smsSent(),
      dashboardRepository.feedbackReceived(),
      dashboardRepository.attendeeCounts(),
    ]);

    return {
      totalRegistrations,
      discipleRegistrations,
      nonDiscipleRegistrations,
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
    };
  }
}

module.exports = new DashboardService();
