const smsService = require('../services/sms.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

class SmsController {
  sendCampaign = asyncHandler(async (req, res) => {
    const result = await smsService.sendCampaign(req.body, req.user.sub);
    return ApiResponse.created(res, {
      data: result,
      message: 'SMS campaign processed.',
    });
  });

  listCampaigns = asyncHandler(async (req, res) => {
    const { data, meta } = await smsService.listCampaigns(req.query);
    return ApiResponse.send(res, { data, meta, message: messages.FETCHED });
  });

  listLogs = asyncHandler(async (req, res) => {
    const { data, meta } = await smsService.listLogs(
      req.params.campaignId,
      req.query
    );
    return ApiResponse.send(res, { data, meta, message: messages.FETCHED });
  });
}

module.exports = new SmsController();
