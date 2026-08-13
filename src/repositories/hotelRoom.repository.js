const { HotelRoom, Hotel } = require('../models');

class HotelRoomRepository {
  create(data, options = {}) {
    return HotelRoom.create(data, options);
  }

  findById(id, options = {}) {
    return HotelRoom.findByPk(id, {
      include: [{ model: Hotel, as: 'hotel' }],
      ...options,
    });
  }

  findByIdForUpdate(id, transaction) {
    return HotelRoom.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
      include: [{ model: Hotel, as: 'hotel' }],
    });
  }

  findByHotelId(hotelId, options = {}) {
    return HotelRoom.findAll({
      where: { hotel_id: hotelId },
      order: [['room_no', 'ASC']],
      ...options,
    });
  }

  updateInstance(instance, data, options = {}) {
    return instance.update(data, options);
  }

  destroy(id, options = {}) {
    return HotelRoom.destroy({ where: { id }, ...options });
  }
}

module.exports = new HotelRoomRepository();