const { AccommodationAvailability } = require('../models');

class AccommodationAvailabilityRepository {
  findAll(options = {}) {
    return AccommodationAvailability.findAll({
      order: [
        ['accommodation_type', 'ASC'],
        ['gender', 'ASC'],
      ],
      ...options,
    });
  }

  findById(id, options = {}) {
    return AccommodationAvailability.findByPk(id, options);
  }

  findOne(where, options = {}) {
    return AccommodationAvailability.findOne({ where, ...options });
  }

  bulkCreate(rows, options = {}) {
    return AccommodationAvailability.bulkCreate(rows, options);
  }

  updateInstance(instance, data, options = {}) {
    return instance.update(data, options);
  }
}

module.exports = new AccommodationAvailabilityRepository();