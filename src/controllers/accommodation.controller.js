const accommodationService = require('../services/accommodation.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

/**
 * HTTP layer for hotel & room assignment.
 */
class AccommodationController {
  assign = asyncHandler(async (req, res) => {
    const assignment = await accommodationService.assign(
      req.params.registrationId,
      req.body,
      req.user.sub
    );
    return ApiResponse.created(res, {
      data: assignment,
      message: 'Accommodation assigned successfully.',
    });
  });

  update = asyncHandler(async (req, res) => {
    const assignment = await accommodationService.update(req.params.id, req.body);
    return ApiResponse.send(res, {
      data: assignment,
      message: messages.UPDATED,
    });
  });

  getByRegistration = asyncHandler(async (req, res) => {
    const assignment = await accommodationService.getByRegistrationId(
      req.params.registrationId
    );
    return ApiResponse.send(res, {
      data: assignment,
      message: messages.FETCHED,
    });
  });

  list = asyncHandler(async (req, res) => {
    const { data, meta } = await accommodationService.list(req.query);
    return ApiResponse.send(res, { data, meta, message: messages.FETCHED });
  });
}

module.exports = new AccommodationController();
