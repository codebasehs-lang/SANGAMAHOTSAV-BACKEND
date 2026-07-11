const { SeminarHall } = require('../models');

/**
 * Data-access layer for seminar halls.
 */
class SeminarHallRepository {
  create(data, options = {}) {
    return SeminarHall.create(data, options);
  }

  findById(id, options = {}) {
    return SeminarHall.findByPk(id, options);
  }

  findActive(options = {}) {
    return SeminarHall.findOne({ where: { is_active: true }, ...options });
  }

  findAll(options = {}) {
    return SeminarHall.findAll({ order: [['created_at', 'DESC']], ...options });
  }

  /** Deactivate every hall (used before activating a new one). */
  deactivateAll(options = {}) {
    return SeminarHall.update({ isActive: false }, { where: {}, ...options });
  }

  updateInstance(instance, data, options = {}) {
    return instance.update(data, options);
  }

  destroy(id, options = {}) {
    return SeminarHall.destroy({ where: { id }, ...options });
  }
}

module.exports = new SeminarHallRepository();
