const { sequelize } = require('../models');
const accommodationRepository = require('../repositories/accommodation.repository');
const accommodationAvailabilityRepository = require('../repositories/accommodationAvailability.repository');
const hotelRoomRepository = require('../repositories/hotelRoom.repository');
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
    const requestedAccommodationType =
      registration.sharedAccommodation || registration.familyAccommodation || null;
    const requestedOccupancy = Number(payload.assignedOccupancy || 1);

    return sequelize.transaction(async (t) => {
      let assignment = await accommodationRepository.findByRegistrationId(
        registrationId,
        { transaction: t }
      );

      const previousStatus = assignment?.status;
      const previousRoomId = assignment?.hotelRoomId || null;
      const previousAssignedOccupancy = assignment?.assignedOccupancy || 1;

      if (status === ASSIGNMENT_STATUS.ASSIGNED && !payload.hotelRoomId) {
        throw ApiError.badRequest('Please select a room before assigning accommodation.', [
          { field: 'hotelRoomId', message: 'Room selection is required for assignment.' },
        ]);
      }

      let room = null;
      if (payload.hotelRoomId) {
        room = await this._getRoomForAssignment(payload.hotelRoomId, t);
        this._ensureRoomTypeMatchesRequest(room, requestedAccommodationType);
        this._ensureRoomHasCapacity(room, {
          previousRoomId,
          previousStatus,
          previousAssignedOccupancy,
          requestedOccupancy,
          nextStatus: status,
        });
      }

      const data = {
        registrationId,
        hotelName: room?.hotel?.hotelName || payload.hotelName,
        hotelAddress: room?.hotel?.hotelAddress || payload.hotelAddress,
        roomNumber: room?.roomNo || payload.roomNumber,
        hotelRoomId: room?.id || null,
        assignedOccupancy: requestedOccupancy,
        hotelMapLink: room?.hotel?.hotelMapLink || payload.hotelMapLink || null,
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

      await this._adjustRoomOccupancy({
        previousStatus,
        previousRoomId,
        previousAssignedOccupancy,
        nextStatus: status,
        nextRoomId: data.hotelRoomId,
        nextAssignedOccupancy: requestedOccupancy,
        transaction: t,
      });

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

    const registration = await registrationRepository.findById(assignment.registrationId);
    const requestedAccommodationType =
      registration?.sharedAccommodation || registration?.familyAccommodation || null;

    const status = payload.status || assignment.status;
    const requestedOccupancy = Number(
      payload.assignedOccupancy || assignment.assignedOccupancy || 1
    );

    return sequelize.transaction(async (t) => {
      const hasExplicitRoomId = Object.prototype.hasOwnProperty.call(
        payload,
        'hotelRoomId'
      );
      const requestedRoomId = hasExplicitRoomId
        ? payload.hotelRoomId || null
        : assignment.hotelRoomId || null;

      if (status === ASSIGNMENT_STATUS.ASSIGNED && !requestedRoomId) {
        throw ApiError.badRequest('Please select a room before assigning accommodation.', [
          { field: 'hotelRoomId', message: 'Room selection is required for assignment.' },
        ]);
      }

      let room = null;
      if (requestedRoomId) {
        room = await this._getRoomForAssignment(requestedRoomId, t);
        this._ensureRoomTypeMatchesRequest(room, requestedAccommodationType);
        this._ensureRoomHasCapacity(room, {
          previousRoomId: assignment.hotelRoomId,
          previousStatus: assignment.status,
          previousAssignedOccupancy: assignment.assignedOccupancy || 1,
          requestedOccupancy,
          nextStatus: status,
        });
      }

      const nextRoomId = hasExplicitRoomId
        ? room?.id || null
        : assignment.hotelRoomId || null;
      const nextPayload = {
        ...payload,
        hotelName: room?.hotel?.hotelName || payload.hotelName,
        hotelAddress: room?.hotel?.hotelAddress || payload.hotelAddress,
        roomNumber: room?.roomNo || payload.roomNumber,
        assignedOccupancy: requestedOccupancy,
        hotelMapLink: room?.hotel?.hotelMapLink || payload.hotelMapLink,
      };
      if (hasExplicitRoomId) {
        nextPayload.hotelRoomId = nextRoomId;
      }

      await accommodationRepository.updateInstance(
        assignment,
        {
          ...nextPayload,
          assignedAt:
            status === ASSIGNMENT_STATUS.ASSIGNED
              ? assignment.assignedAt || new Date()
              : null,
        },
        { transaction: t }
      );

      await this._adjustRoomOccupancy({
        previousStatus: assignment.status,
        previousRoomId: assignment.hotelRoomId,
        previousAssignedOccupancy: assignment.assignedOccupancy || 1,
        nextStatus: status,
        nextRoomId,
        nextAssignedOccupancy: requestedOccupancy,
        transaction: t,
      });

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

  async _getRoomForAssignment(roomId, transaction) {
    const room = await hotelRoomRepository.findByIdForUpdate(roomId, transaction);
    if (!room) {
      throw ApiError.notFound('Selected room not found.');
    }
    if (!room.isActive) {
      throw ApiError.badRequest('Selected room is inactive. Please select another room.');
    }
    return room;
  }

  async _adjustRoomOccupancy({
    previousStatus,
    previousRoomId,
    previousAssignedOccupancy,
    nextStatus,
    nextRoomId,
    nextAssignedOccupancy,
    transaction,
  }) {
    const wasAssigned = previousStatus === ASSIGNMENT_STATUS.ASSIGNED;
    const isAssigned = nextStatus === ASSIGNMENT_STATUS.ASSIGNED;

    if (wasAssigned && previousRoomId && (!isAssigned || previousRoomId !== nextRoomId)) {
      const previousRoom = await hotelRoomRepository.findByIdForUpdate(previousRoomId, transaction);
      if (previousRoom) {
        const updatedValue = Math.max(
          0,
          (previousRoom.currentOccupancy || 0) - Number(previousAssignedOccupancy || 1)
        );
        await hotelRoomRepository.updateInstance(
          previousRoom,
          { currentOccupancy: updatedValue },
          { transaction }
        );
      }
    }

    if (isAssigned && nextRoomId && (!wasAssigned || previousRoomId !== nextRoomId)) {
      const nextRoom = await hotelRoomRepository.findByIdForUpdate(nextRoomId, transaction);
      if (nextRoom) {
        await hotelRoomRepository.updateInstance(
          nextRoom,
          {
            currentOccupancy:
              (nextRoom.currentOccupancy || 0) + Number(nextAssignedOccupancy || 1),
          },
          { transaction }
        );
      }
    }

    if (isAssigned && nextRoomId && wasAssigned && previousRoomId === nextRoomId) {
      const room = await hotelRoomRepository.findByIdForUpdate(nextRoomId, transaction);
      if (room) {
        const updatedValue = Math.max(
          0,
          (room.currentOccupancy || 0) - Number(previousAssignedOccupancy || 1)
        ) + Number(nextAssignedOccupancy || 1);
        await hotelRoomRepository.updateInstance(
          room,
          { currentOccupancy: updatedValue },
          { transaction }
        );
      }
    }
  }

  _ensureRoomTypeMatchesRequest(room, requestedAccommodationType) {
    if (!requestedAccommodationType) return;
    if (room.roomType === requestedAccommodationType) return;

    throw ApiError.badRequest(
      `Selected room type (${room.roomType}) does not match requested accommodation type (${requestedAccommodationType}).`,
      [
        {
          field: 'hotelRoomId',
          message: 'Selected room type does not match devotee accommodation preference.',
        },
      ]
    );
  }

  _ensureRoomHasCapacity(room, {
    previousRoomId,
    previousStatus,
    previousAssignedOccupancy,
    requestedOccupancy,
    nextStatus,
  }) {
    if (nextStatus !== ASSIGNMENT_STATUS.ASSIGNED) return;

    const isSameAssignedRoom =
      previousStatus === ASSIGNMENT_STATUS.ASSIGNED &&
      String(previousRoomId || '') === String(room.id);

    const effectiveOccupancy = isSameAssignedRoom
      ? Math.max(0, (room.currentOccupancy || 0) - Number(previousAssignedOccupancy || 1))
      : room.currentOccupancy || 0;

    if (effectiveOccupancy + Number(requestedOccupancy || 1) > room.roomCapacity) {
      throw ApiError.badRequest(
        `Room ${room.roomNo} cannot fit ${requestedOccupancy} devotees. Current occupancy is ${room.currentOccupancy}/${room.roomCapacity}.`,
        [{ field: 'hotelRoomId', message: 'Selected room has reached full capacity.' }]
      );
    }
  }
}

module.exports = new AccommodationService();
