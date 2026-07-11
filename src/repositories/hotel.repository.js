const { Hotel } = require('../models');

/**
 * Data-access layer for hotels.
 */
class HotelRepository {
  create(data, options = {}) {
    return Hotel.create(data, options);
  }

  findById(id, options = {}) {
    return Hotel.findByPk(id, options);
  }

  findAll(options = {}) {
    return Hotel.findAll({ order: [['hotel_name', 'ASC']], ...options });
  }

  updateInstance(instance, data, options = {}) {
    return instance.update(data, options);
  }

  destroy(id, options = {}) {
    return Hotel.destroy({ where: { id }, ...options });
  }
}

module.exports = new HotelRepository();
