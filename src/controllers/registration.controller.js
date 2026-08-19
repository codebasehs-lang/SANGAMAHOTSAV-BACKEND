const registrationService = require('../services/registration.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

/**
 * HTTP layer for registrations.
 */
class RegistrationController {
  // Public
  create = asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    
    // Handle both single file (legacy) and multiple files (new)
    if (req.file) {
      // Legacy: single paymentScreenshot
      payload.paymentScreenshot = `/uploads/payment-screenshots/${req.file.filename}`;
    }
    
    // Handle multiple screenshot uploads
    if (req.files && typeof req.files === 'object') {
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
}

module.exports = new RegistrationController();
