const feedbackService = require('../services/feedback.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

class FeedbackController {
  // Public
  create = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.create(req.body);
    return ApiResponse.created(res, {
      data: feedback,
      message: 'Thank you for your feedback.',
    });
  });

  // Admin
  list = asyncHandler(async (req, res) => {
    const { data, meta } = await feedbackService.list(req.query);
    return ApiResponse.send(res, { data, meta, message: messages.FETCHED });
  });

  getById = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.getById(req.params.id);
    return ApiResponse.send(res, { data: feedback, message: messages.FETCHED });
  });

  export = asyncHandler(async (req, res) => {
    const buffer = await feedbackService.exportToExcel(req.query);
    const filename = `feedback_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(Buffer.from(buffer));
  });
}

module.exports = new FeedbackController();
