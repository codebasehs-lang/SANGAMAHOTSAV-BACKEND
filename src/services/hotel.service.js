const hotelRepository = require('../repositories/hotel.repository');
const hotelRoomRepository = require('../repositories/hotelRoom.repository');
const ApiError = require('../utils/ApiError');

/**
 * Business logic for the hotel directory. Hotels are reusable
 * records that admins pick from when assigning accommodation.
 */
class HotelService {
  create(payload) {
    return hotelRepository.create(payload);
  }

  async update(id, payload) {
    const hotel = await this.getById(id);
    return hotelRepository.updateInstance(hotel, payload);
  }

  async getById(id) {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw ApiError.notFound('Hotel not found.');
    return hotel;
  }

  list() {
    return hotelRepository.findAll();
  }

  async remove(id) {
    await this.getById(id);
    await hotelRepository.destroy(id);
    return true;
  }

  async createRoom(hotelId, payload) {
    await this.getById(hotelId);
    return hotelRoomRepository.create({ ...payload, hotelId });
  }

  async updateRoom(hotelId, roomId, payload) {
    await this.getById(hotelId);
    const room = await this.getRoomById(hotelId, roomId);
    return hotelRoomRepository.updateInstance(room, payload);
  }

  async getRoomById(hotelId, roomId) {
    const room = await hotelRoomRepository.findById(roomId);
    if (!room || String(room.hotelId) !== String(hotelId)) {
      throw ApiError.notFound('Hotel room not found.');
    }
    return room;
  }

  async removeRoom(hotelId, roomId) {
    await this.getRoomById(hotelId, roomId);
    await hotelRoomRepository.destroy(roomId);
    return true;
  }
}

module.exports = new HotelService();
