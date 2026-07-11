const { Op } = require('sequelize');
const { Registration, AccommodationAssignment } = require('../models');

/**
 * Data-access layer for registrations. All Sequelize queries live here.
 */
class RegistrationRepository {
  create(data, options = {}) {
    return Registration.create(data, options);
  }

  findByMobile(mobileNumber) {
    return Registration.findOne({ where: { mobile_number: mobileNumber } });
  }

  findById(id, options = {}) {
    return Registration.findByPk(id, options);
  }

  findByIdWithAssignment(id) {
    return Registration.findByPk(id, {
      include: [{ model: AccommodationAssignment, as: 'assignment' }],
    });
  }

  /**
   * Paginated + filtered list.
   * @param {object} params - { limit, offset, search, filters, order }
   */
  findAndCountAll({ limit, offset, where, order }) {
    return Registration.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [{ model: AccommodationAssignment, as: 'assignment' }],
      distinct: true,
    });
  }

  /** Full result set (no pagination) — used for Excel export. */
  findAllForExport({ where, order }) {
    return Registration.findAll({
      where,
      order,
      include: [{ model: AccommodationAssignment, as: 'assignment' }],
    });
  }

  update(id, data) {
    return Registration.update(data, { where: { id } });
  }

  destroy(id) {
    return Registration.destroy({ where: { id } });
  }

  /**
   * Builds a WHERE clause from search + filter params.
   * Search matches name, mobile number, or place.
   */
  buildWhere({ search, status, category }) {
    const where = {};

    if (search) {
      const like = { [Op.like]: `%${search}%` };
      where[Op.or] = [
        { name: like },
        { mobile_number: like },
        { coming_from: like },
      ];
    }

    if (status) where.accommodation_status = status;
    if (category) where.devotee_category = category;

    return where;
  }

  countAll() {
    return Registration.count();
  }
}

module.exports = new RegistrationRepository();
