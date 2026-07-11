const dashboardRepository = require('../repositories/dashboard.repository');

/**
 * Assembles the dashboard summary. Counts run in parallel since
 * they are independent read-only queries.
 */
class DashboardService {
  async getSummary() {
    const [
      totalRegistrations,
      devoteesRequiringStay,
      assignedRooms,
      pendingAssignments,
      smsSent,
      feedbackReceived,
    ] = await Promise.all([
      dashboardRepository.totalRegistrations(),
      dashboardRepository.devoteesRequiringStay(),
      dashboardRepository.assignedRooms(),
      dashboardRepository.pendingAssignments(),
      dashboardRepository.smsSent(),
      dashboardRepository.feedbackReceived(),
    ]);

    return {
      totalRegistrations,
      devoteesRequiringStay,
      assignedRooms,
      pendingAssignments,
      smsSent,
      feedbackReceived,
    };
  }
}

module.exports = new DashboardService();
