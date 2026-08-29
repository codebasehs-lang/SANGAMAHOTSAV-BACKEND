const registrationService = require('../services/registration.service');
const registrationSettingService = require('../services/registrationSetting.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

/**
 * HTTP layer for registrations.
 */
class RegistrationController {
  // Public
  create = asyncHandler(async (req, res) => {
    const setting = await registrationSettingService.getSetting();
    if (!setting.isOpen) {
      throw ApiError.forbidden(
        setting.closedMessage || 'Registrations are currently closed.'
      );
    }

    const payload = { ...req.body };
    
    // Handle both single file (legacy) and multiple files (new)
    if (req.file) {
      // Legacy: single paymentScreenshot
      payload.paymentScreenshot = `/uploads/payment-screenshots/${req.file.filename}`;
    }
    
    // Handle multiple screenshot uploads (multer .fields() populates req.files, not req.file)
    if (req.files && typeof req.files === 'object') {
      if (req.files.paymentScreenshot && req.files.paymentScreenshot.length > 0) {
        payload.paymentScreenshot = `/uploads/payment-screenshots/${req.files.paymentScreenshot[0].filename}`;
      }
      if (req.files.paymentScreenshot1 && req.files.paymentScreenshot1.length > 0) {
        payload.paymentScreenshot1 = `/uploads/payment-screenshots/${req.files.paymentScreenshot1[0].filename}`;
      }
      if (req.files.paymentScreenshot2 && req.files.paymentScreenshot2.length > 0) {
        payload.paymentScreenshot2 = `/uploads/payment-screenshots/${req.files.paymentScreenshot2[0].filename}`;
      }
      if (req.files.paymentScreenshot3 && req.files.paymentScreenshot3.length > 0) {
        payload.paymentScreenshot3 = `/uploads/payment-screenshots/${req.files.paymentScreenshot3[0].filename}`;
      }
    }
    
    const registration = await registrationService.create(payload);
    return ApiResponse.created(res, {
      data: registration,
      message: 'Registration submitted successfully.',
    });
  });

  // Admin
  list = asyncHandler(async (req, res) => {
    const { data, meta } = await registrationService.list(req.query);
    return ApiResponse.send(res, { data, meta, message: messages.FETCHED });
  });

  attendanceLookup = asyncHandler(async (req, res) => {
    const data = await registrationService.lookupAttendance(req.query);
    return ApiResponse.send(res, { data, message: messages.FETCHED });
  });

  updateAttendance = asyncHandler(async (req, res) => {
    const registration = await registrationService.updateAttendance(
      req.params.id,
      req.body,
      req.user.sub
    );
    return ApiResponse.send(res, { data: registration, message: messages.UPDATED });
  });

  getById = asyncHandler(async (req, res) => {
    const registration = await registrationService.getById(req.params.id);
    return ApiResponse.send(res, {
      data: registration,
      message: messages.FETCHED,
    });
  });

  update = asyncHandler(async (req, res) => {
    const registration = await registrationService.update(
      req.params.id,
      req.body
    );
    return ApiResponse.send(res, {
      data: registration,
      message: messages.UPDATED,
    });
  });

  remove = asyncHandler(async (req, res) => {
    await registrationService.remove(req.params.id);
    return ApiResponse.send(res, { message: messages.DELETED });
  });

  approvePayment = asyncHandler(async (req, res) => {
    const registration = await registrationService.approvePayment(req.params.id, req.user.sub);
    return ApiResponse.send(res, {
      data: registration,
      message: 'Payment approved successfully.',
    });
  });

  unapprovePayment = asyncHandler(async (req, res) => {
    const registration = await registrationService.unapprovePayment(req.params.id);
    return ApiResponse.send(res, {
      data: registration,
      message: 'Payment approval reverted.',
    });
  });

  export = asyncHandler(async (req, res) => {
    const buffer = await registrationService.exportToExcel(req.query);
    const filename = `registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(Buffer.from(buffer));
  });

  getChildren = asyncHandler(async (req, res) => {
    const result = await registrationService.getChildren(req.query);
    return ApiResponse.send(res, {
      data: result.data,
      meta: result.meta,
      summary: result.summary,
      message: messages.FETCHED,
    });
  });

  updateChildGiftStatus = asyncHandler(async (req, res) => {
    const result = await registrationService.updateChildGiftStatus(
      req.body,
      req.user?.sub
    );
    return ApiResponse.send(res, {
      data: result,
      message: 'Gift status updated successfully.',
    });
  });

  exportChildren = asyncHandler(async (req, res) => {
    const buffer = await registrationService.exportChildrenToExcel(req.query);
    const filename = `children_gifts_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(Buffer.from(buffer));
  });
}

module.exports = new RegistrationController();
