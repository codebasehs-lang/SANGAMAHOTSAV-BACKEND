const { sequelize } = require('../models');
const accommodationRepository = require('../repositories/accommodation.repository');
const registrationRepository = require('../repositories/registration.repository');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');
const {
  ASSIGNMENT_STATUS,
  ACCOMMODATION_STATUS,
} = require('../constants/enums');

/**
 * Business logic for hotel & room assignment. Each registration has
 * at most one assignment (upsert). Assigning keeps the registration's
 * accommodation_status in sync within a transaction.
 */
class AccommodationService {
  /**
   * Assign (or re-assign) accommodation to a registration.
   * Creates the assignment if absent, otherwise updates it.
   */
  async assign(registrationId, payload, adminId) {
    const registration = await registrationRepository.findById(registrationId);
    if (!registration) {
      throw ApiError.notFound('Registration not found.');
    }

    const status = payload.status || ASSIGNMENT_STATUS.ASSIGNED;

    return sequelize.transaction(async (t) => {
      let assignment = await accommodationRepository.findByRegistrationId(
        registrationId,
        { transaction: t }
      );

      const data = {
        registrationId,
        hotelName: payload.hotelName,
        hotelAddress: payload.hotelAddress,
        roomNumber: payload.roomNumber,
        hotelMapLink: payload.hotelMapLink || null,
        status,
        assignedBy: adminId,
        assignedAt: status === ASSIGNMENT_STATUS.ASSIGNED ? new Date() : null,
      };

      if (assignment) {
        assignment = await accommodationRepository.updateInstance(
          assignment,
          data,
          { transaction: t }
        );
      } else {
        assignment = await accommodationRepository.create(data, {
          transaction: t,
        });
      }

      // Keep the registration's derived status aligned.
      const regStatus =
        status === ASSIGNMENT_STATUS.ASSIGNED
          ? ACCOMMODATION_STATUS.ASSIGNED
          : ACCOMMODATION_STATUS.PENDING;
      await registration.update(
        { accommodationStatus: regStatus },
        { transaction: t }
      );

      return assignment;
    });
  }

  /** Update an existing assignment by its own id. */
  async update(id, payload) {
    const assignment = await accommodationRepository.findById(id);
    if (!assignment) throw ApiError.notFound('Assignment not found.');

    const status = payload.status || assignment.status;

    return sequelize.transaction(async (t) => {
      await accommodationRepository.updateInstance(
        assignment,
        {
          ...payload,
          assignedAt:
            status === ASSIGNMENT_STATUS.ASSIGNED
              ? assignment.assignedAt || new Date()
              : null,
        },
        { transaction: t }
      );

      const regStatus =
        status === ASSIGNMENT_STATUS.ASSIGNED
          ? ACCOMMODATION_STATUS.ASSIGNED
          : ACCOMMODATION_STATUS.PENDING;
      await registrationRepository.update(assignment.registrationId, {
        accommodationStatus: regStatus,
      });

      return accommodationRepository.findById(id);
    });
  }

  async getByRegistrationId(registrationId) {
    const assignment = await accommodationRepository.findByRegistrationId(
      registrationId
    );
    if (!assignment) throw ApiError.notFound('Assignment not found.');
    return assignment;
  }

  async list(query) {
    const { page, limit, offset } = getPagination(query);
    const where = {};
    if (query.status) where.status = query.status;

    const { rows, count } = await accommodationRepository.findAndCountAll({
      limit,
      offset,
      where,
      order: [['updated_at', 'DESC']],
    });

    return { data: rows, meta: buildMeta({ count, page, limit }) };
  }
}

module.exports = new AccommodationService();
