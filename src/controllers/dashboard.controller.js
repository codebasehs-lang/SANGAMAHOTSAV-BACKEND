const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

class DashboardController {
  summary = asyncHandler(async (req, res) => {
    const data = await dashboardService.getSummary();
    return ApiResponse.send(res, { data, message: messages.FETCHED });
  });
}

module.exports = new DashboardController();
