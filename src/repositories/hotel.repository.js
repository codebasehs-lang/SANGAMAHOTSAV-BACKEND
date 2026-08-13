const { Hotel, HotelRoom } = require('../models');

/**
 * Data-access layer for hotels.
 */
class HotelRepository {
  create(data, options = {}) {
    return Hotel.create(data, options);
  }

  findById(id, options = {}) {
    return Hotel.findByPk(id, {
      include: [{ model: HotelRoom, as: 'rooms', required: false }],
      ...options,
    });
  }

  findAll(options = {}) {
    return Hotel.findAll({
      order: [
        ['hotel_name', 'ASC'],
        [{ model: HotelRoom, as: 'rooms' }, 'room_no', 'ASC'],
      ],
      include: [{ model: HotelRoom, as: 'rooms', required: false }],
      ...options,
    });
  }

  updateInstance(instance, data, options = {}) {
    return instance.update(data, options);
  }

  destroy(id, options = {}) {
    return Hotel.destroy({ where: { id }, ...options });
  }
}

module.exports = new HotelRepository();
