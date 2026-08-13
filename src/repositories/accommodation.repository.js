const { AccommodationAssignment, Registration, HotelRoom } = require('../models');
const { ASSIGNMENT_STATUS } = require('../constants/enums');

/**
 * Data-access layer for accommodation assignments.
 */
class AccommodationRepository {
  findByRegistrationId(registrationId, options = {}) {
    return AccommodationAssignment.findOne({
      where: { registration_id: registrationId },
      include: [{ model: HotelRoom, as: 'hotelRoom', required: false }],
      ...options,
    });
  }

  findById(id, options = {}) {
    return AccommodationAssignment.findByPk(id, {
      include: [
        { model: Registration, as: 'registration' },
        { model: HotelRoom, as: 'hotelRoom', required: false },
      ],
      ...options,
    });
  }

  create(data, options = {}) {
    return AccommodationAssignment.create(data, options);
  }

  updateInstance(instance, data, options = {}) {
    return instance.update(data, options);
  }

  findAndCountAll({ limit, offset, where, order }) {
    return AccommodationAssignment.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        { model: Registration, as: 'registration' },
        { model: HotelRoom, as: 'hotelRoom', required: false },
      ],
      distinct: true,
    });
  }

  countByStatus(status = ASSIGNMENT_STATUS.ASSIGNED) {
    return AccommodationAssignment.count({ where: { status } });
  }
}

module.exports = new AccommodationRepository();
