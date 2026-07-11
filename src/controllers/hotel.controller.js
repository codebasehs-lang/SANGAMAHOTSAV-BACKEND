const hotelService = require('../services/hotel.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');

class HotelController {
  create = asyncHandler(async (req, res) => {
    const hotel = await hotelService.create(req.body);
    return ApiResponse.created(res, {
      data: hotel,
      message: 'Hotel created successfully.',
    });
  });

  list = asyncHandler(async (req, res) => {
    const hotels = await hotelService.list();
    return ApiResponse.send(res, { data: hotels, message: messages.FETCHED });
  });

  getById = asyncHandler(async (req, res) => {
    const hotel = await hotelService.getById(req.params.id);
    return ApiResponse.send(res, { data: hotel, message: messages.FETCHED });
  });

  update = asyncHandler(async (req, res) => {
    const hotel = await hotelService.update(req.params.id, req.body);
    return ApiResponse.send(res, { data: hotel, message: messages.UPDATED });
  });

  remove = asyncHandler(async (req, res) => {
    await hotelService.remove(req.params.id);
    return ApiResponse.send(res, { message: messages.DELETED });
  });
}

module.exports = new HotelController();
