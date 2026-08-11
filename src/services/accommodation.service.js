const { sequelize } = require('../models');
const accommodationRepository = require('../repositories/accommodation.repository');
const accommodationAvailabilityRepository = require('../repositories/accommodationAvailability.repository');
const registrationRepository = require('../repositories/registration.repository');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');
const {
  ASSIGNMENT_STATUS,
  ACCOMMODATION_STATUS,
  PAYMENT_STATUS,
  SHARED_ACCOMMODATION,
  FAMILY_ACCOMMODATION,
  ACCOMMODATION_AVAILABILITY_GENDER,
  values,
} = require('../constants/enums');

const DEFAULT_AVAILABILITY_ROWS = [
  {
    accommodationType: SHARED_ACCOMMODATION.DORMITORY,
    gender: ACCOMMODATION_AVAILABILITY_GENDER.MALE,
  },
  {
    accommodationType: SHARED_ACCOMMODATION.DORMITORY,
    gender: ACCOMMODATION_AVAILABILITY_GENDER.FEMALE,
  },
  ...values(SHARED_ACCOMMODATION)
    .filter((type) => type !== SHARED_ACCOMMODATION.DORMITORY)
    .map((accommodationType) => ({
      accommodationType,
      gender: ACCOMMODATION_AVAILABILITY_GENDER.ALL,
    })),
  ...values(FAMILY_ACCOMMODATION).map((accommodationType) => ({
    accommodationType,
    gender: ACCOMMODATION_AVAILABILITY_GENDER.ALL,
  })),
].map((row) => ({
  ...row,
  isOpen: true,
  statusMessage: null,
}));

/**
 * Business logic for hotel & room assignment. Each registration has
 * at most one assignment (upsert). Assigning keeps the registration's
 * accommodation_status in sync within a transaction.
 */
class AccommodationService {
  async listAvailability() {
    await this._ensureDefaultAvailability();
    return accommodationAvailabilityRepository.findAll();
  }

  async updateAvailability(id, payload) {
    await this._ensureDefaultAvailability();
    const availability = await accommodationAvailabilityRepository.findById(id);
    if (!availability) {
      throw ApiError.notFound('Accommodation availability setting not found.');
    }

    return accommodationAvailabilityRepository.updateInstance(availability, payload);
  }

  async ensureSelectionAllowed({ accommodationType, gender, fieldName }) {
    if (!accommodationType) return;

    const availability = await this._getAvailabilityForSelection({
      accommodationType,
      gender,
    });

    if (!availability || availability.isOpen) return;

    const message =
      availability.statusMessage ||
      'This accommodation option is no longer available. Please choose another option.';

    throw ApiError.conflict(message, [
      { field: fieldName || 'accommodation', message },
    ]);
  }

  /**
   * Assign (or re-assign) accommodation to a registration.
   * Creates the assignment if absent, otherwise updates it.
   */
  async assign(registrationId, payload, adminId) {
    const registration = await registrationRepository.findById(registrationId);
    if (!registration) {
      throw ApiError.notFound('Registration not found.');
    }

    if (registration.paymentStatus !== PAYMENT_STATUS.APPROVED) {
      throw ApiError.badRequest(
        'Payment must be approved before assigning accommodation.',
        [{ field: 'paymentStatus', message: 'Payment not yet approved.' }]
      );
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
        additionalHotelName: payload.additionalHotelName || null,
        additionalHotelAddress: payload.additionalHotelAddress || null,
        additionalRoomNumber: payload.additionalRoomNumber || null,
        additionalHotelMapLink: payload.additionalHotelMapLink || null,
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

  async _ensureDefaultAvailability() {
    const rows = await accommodationAvailabilityRepository.findAll();
    const existingKeys = new Set(
      rows.map((row) => `${row.accommodationType}:${row.gender}`)
    );
    const missingRows = DEFAULT_AVAILABILITY_ROWS.filter(
      (row) => !existingKeys.has(`${row.accommodationType}:${row.gender}`)
    );

    if (missingRows.length > 0) {
      await accommodationAvailabilityRepository.bulkCreate(missingRows, {
        ignoreDuplicates: true,
      });
    }
  }

  async _getAvailabilityForSelection({ accommodationType, gender }) {
    await this._ensureDefaultAvailability();

    const scope =
      accommodationType === SHARED_ACCOMMODATION.DORMITORY
        ? gender || ACCOMMODATION_AVAILABILITY_GENDER.ALL
        : ACCOMMODATION_AVAILABILITY_GENDER.ALL;

    return accommodationAvailabilityRepository.findOne({
      accommodationType,
      gender: scope,
    });
  }
}

module.exports = new AccommodationService();
