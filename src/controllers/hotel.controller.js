const hotelService = require('../services/hotel.service');
const excelService = require('../services/excel.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
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

  createRoom = asyncHandler(async (req, res) => {
    const room = await hotelService.createRoom(req.params.id, req.body);
    return ApiResponse.created(res, {
      data: room,
      message: 'Hotel room created successfully.',
    });
  });

  updateRoom = asyncHandler(async (req, res) => {
    const room = await hotelService.updateRoom(
      req.params.id,
      req.params.roomId,
      req.body
    );
    return ApiResponse.send(res, { data: room, message: messages.UPDATED });
  });

  removeRoom = asyncHandler(async (req, res) => {
    await hotelService.removeRoom(req.params.id, req.params.roomId);
    return ApiResponse.send(res, { message: messages.DELETED });
  });

  importExcel = asyncHandler(async (req, res) => {
    if (!req.file || !req.file.buffer) {
      throw ApiError.badRequest('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
    }
    const result = await hotelService.importFromExcel(req.file.buffer);
    return ApiResponse.send(res, {
      data: result,
      message: 'Hotels and rooms imported successfully.',
    });
  });

  downloadImportTemplate = asyncHandler(async (req, res) => {
    const buffer = await excelService.buildHotelTemplateWorkbook();
    const filename = 'hotels_rooms_import_template.xlsx';
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(Buffer.from(buffer));
  });
}

module.exports = new HotelController();
