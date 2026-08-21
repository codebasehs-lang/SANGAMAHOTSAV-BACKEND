const registrationSettingService = require('../services/registrationSetting.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

/**
 * HTTP layer for toggling public registration open/closed status.
 */
class RegistrationSettingController {
  getPublic = asyncHandler(async (req, res) => {
    const setting = await registrationSettingService.getSetting();
    return ApiResponse.send(res, {
      data: { isOpen: setting.isOpen, closedMessage: setting.closedMessage },
      message: messages.FETCHED,
    });
  });

  get = asyncHandler(async (req, res) => {
    const setting = await registrationSettingService.getSetting();
    return ApiResponse.send(res, { data: setting, message: messages.FETCHED });
  });

  update = asyncHandler(async (req, res) => {
    const setting = await registrationSettingService.updateSetting(req.body);
    return ApiResponse.send(res, { data: setting, message: messages.UPDATED });
  });
}

module.exports = new RegistrationSettingController();
