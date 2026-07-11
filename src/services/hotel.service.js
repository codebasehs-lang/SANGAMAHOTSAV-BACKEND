const hotelRepository = require('../repositories/hotel.repository');
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
}

module.exports = new HotelService();
