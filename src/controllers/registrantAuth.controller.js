const authService = require('../services/registrant.auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
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

  updateProfilePhoto = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('Profile photo is required.');
    }

    const profilePhotoPath = `/uploads/profile-photos/${req.file.filename}`;
    const result = await authService.updateProfilePhoto(
      req.user.sub,
      profilePhotoPath
    );
    return ApiResponse.send(res, {
      data: result,
      message: 'Profile photo updated successfully.',
    });
  });

  updatePaymentScreenshot = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('Payment screenshot is required.');
    }

    const paymentScreenshotPath = `/uploads/payment-screenshots/${req.file.filename}`;
    const result = await authService.updatePaymentScreenshot(
      req.user.sub,
      paymentScreenshotPath
    );
    return ApiResponse.send(res, {
      data: result,
      message: 'Payment screenshot updated successfully.',
    });
  });
}

module.exports = new RegistrantAuthController();
