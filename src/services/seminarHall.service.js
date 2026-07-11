const { sequelize } = require('../models');
const seminarHallRepository = require('../repositories/seminarHall.repository');
const ApiError = require('../utils/ApiError');

/**
 * Business logic for seminar hall configuration.
 * Enforces the "only one active hall" rule: activating any hall
 * deactivates all others inside a transaction, so the unique
 * active-flag index is never violated.
 */
class SeminarHallService {
  async create(payload) {
    return sequelize.transaction(async (t) => {
      if (payload.isActive) {
        await seminarHallRepository.deactivateAll({ transaction: t });
      }
      return seminarHallRepository.create(payload, { transaction: t });
    });
  }

  async update(id, payload) {
    const hall = await seminarHallRepository.findById(id);
    if (!hall) throw ApiError.notFound('Seminar hall not found.');

    return sequelize.transaction(async (t) => {
      if (payload.isActive) {
        await seminarHallRepository.deactivateAll({ transaction: t });
      }
      return seminarHallRepository.updateInstance(hall, payload, {
        transaction: t,
      });
    });
  }

  /** Explicitly activate a hall (deactivating any other active one). */
  async activate(id) {
    const hall = await seminarHallRepository.findById(id);
    if (!hall) throw ApiError.notFound('Seminar hall not found.');

    return sequelize.transaction(async (t) => {
      await seminarHallRepository.deactivateAll({ transaction: t });
      return seminarHallRepository.updateInstance(
        hall,
        { isActive: true },
        { transaction: t }
      );
    });
  }

  async getById(id) {
    const hall = await seminarHallRepository.findById(id);
    if (!hall) throw ApiError.notFound('Seminar hall not found.');
    return hall;
  }

  getActive() {
    return seminarHallRepository.findActive();
  }

  list() {
    return seminarHallRepository.findAll();
  }

  async remove(id) {
    await this.getById(id);
    await seminarHallRepository.destroy(id);
    return true;
  }
}

module.exports = new SeminarHallService();
