const seminarHallService = require('../services/seminarHall.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

class SeminarHallController {
  create = asyncHandler(async (req, res) => {
    const hall = await seminarHallService.create(req.body);
    return ApiResponse.created(res, {
      data: hall,
      message: 'Seminar hall created successfully.',
    });
  });

  list = asyncHandler(async (req, res) => {
    const halls = await seminarHallService.list();
    return ApiResponse.send(res, { data: halls, message: messages.FETCHED });
  });

  getActive = asyncHandler(async (req, res) => {
    const hall = await seminarHallService.getActive();
    return ApiResponse.send(res, { data: hall, message: messages.FETCHED });
  });

  getById = asyncHandler(async (req, res) => {
    const hall = await seminarHallService.getById(req.params.id);
    return ApiResponse.send(res, { data: hall, message: messages.FETCHED });
  });

  update = asyncHandler(async (req, res) => {
    const hall = await seminarHallService.update(req.params.id, req.body);
    return ApiResponse.send(res, { data: hall, message: messages.UPDATED });
  });

  activate = asyncHandler(async (req, res) => {
    const hall = await seminarHallService.activate(req.params.id);
    return ApiResponse.send(res, {
      data: hall,
      message: 'Seminar hall activated.',
    });
  });

  remove = asyncHandler(async (req, res) => {
    await seminarHallService.remove(req.params.id);
    return ApiResponse.send(res, { message: messages.DELETED });
  });
}

module.exports = new SeminarHallController();
