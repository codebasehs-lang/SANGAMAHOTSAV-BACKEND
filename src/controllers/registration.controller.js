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
    const registration = await registrationService.create(req.body);
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
