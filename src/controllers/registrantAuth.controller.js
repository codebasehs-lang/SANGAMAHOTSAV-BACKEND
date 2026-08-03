const authService = require('../services/registrant.auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

class RegistrantAuthController {
  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    return ApiResponse.send(res, {
      data: result,
      message: messages.LOGIN_SUCCESS,
    });
  });

  me = asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user.sub);
    return ApiResponse.send(res, {
      data: profile,
      message: messages.FETCHED,
    });
  });

  changePassword = asyncHandler(async (req, res) => {
    const result = await authService.changePassword(req.user.sub, req.body);
    return ApiResponse.send(res, {
      data: result,
      message: 'Password changed successfully',
    });
  });
}

module.exports = new RegistrantAuthController();
