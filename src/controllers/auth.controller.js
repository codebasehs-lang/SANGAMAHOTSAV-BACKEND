const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

/**
 * HTTP layer for authentication. Parses the request, delegates to
 * the service, and shapes the response. No business logic here.
 */
class AuthController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return ApiResponse.send(res, {
      data: result,
      message: messages.LOGIN_SUCCESS,
    });
  });

  me = asyncHandler(async (req, res) => {
    const admin = await authService.getProfile(req.user.sub);
    return ApiResponse.send(res, {
      data: admin,
      message: messages.FETCHED,
    });
  });
}

module.exports = new AuthController();
