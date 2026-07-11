const registrationRepository = require('../repositories/registration.repository');
const excelService = require('./excel.service');
const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');
const { getPagination, buildMeta } = require('../utils/pagination');
const { ACCOMMODATION_STATUS, NON_ATTENDING_TYPE } = require('../constants/enums');

const SORTABLE_FIELDS = new Set([
  'id',
  'name',
  'age',
  'mobile_number',
  'coming_from',
  'arrival_date',
  'accommodation_status',
  'created_at',
]);

/**
 * Business logic for the registration module.
 */
class RegistrationService {
  /** Public: create a new registration. */
  async create(payload) {
    const data = { ...payload };

    // Enforce unique mobile with a friendly message (DB unique index
    // is the ultimate safeguard against race conditions).
    const existing = await registrationRepository.findByMobile(
      data.mobileNumber
    );
    if (existing) {
      throw ApiError.conflict(
        'This mobile number is already registered.',
        [{ field: 'mobileNumber', message: 'Mobile number already registered.' }]
      );
    }

    // Devotees who are non-attending / not staying do not need a room.
    if (
      data.nonAttendingType === NON_ATTENDING_TYPE.NON_ATTENDING_DISCIPLE ||
      data.nonAttendingType === NON_ATTENDING_TYPE.ATTENDING_NOT_STAYING
    ) {
      data.accommodationStatus = ACCOMMODATION_STATUS.NOT_REQUIRED;
    } else {
      data.accommodationStatus = ACCOMMODATION_STATUS.PENDING;
    }

    return registrationRepository.create(data);
  }

  /** Admin: paginated, searchable, filterable list. */
  async list(query) {
    const { page, limit, offset } = getPagination(query);
    const where = registrationRepository.buildWhere({
      search: query.search?.trim(),
      status: query.status,
      category: query.category,
    });
    const order = this._buildOrder(query);

    const { rows, count } = await registrationRepository.findAndCountAll({
      limit,
      offset,
      where,
      order,
    });

    return { data: rows, meta: buildMeta({ count, page, limit }) };
  }

  async getById(id) {
    const registration = await registrationRepository.findByIdWithAssignment(id);
    if (!registration) throw ApiError.notFound('Registration not found.');
    return registration;
  }

  async update(id, payload) {
    await this.getById(id); // ensures existence (404 otherwise)
    await registrationRepository.update(id, payload);
    return this.getById(id);
  }

  async remove(id) {
    await this.getById(id);
    await registrationRepository.destroy(id);
    return true;
  }

  /** Admin: export all matching registrations to an xlsx buffer. */
  async exportToExcel(query) {
    const where = registrationRepository.buildWhere({
      search: query.search?.trim(),
      status: query.status,
      category: query.category,
    });
    const order = this._buildOrder(query);
    const rows = await registrationRepository.findAllForExport({ where, order });
    return excelService.buildRegistrationsWorkbook(rows);
  }

  _buildOrder(query) {
    const field = SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'created_at';
    const direction =
      String(query.order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return [[field, direction]];
  }
}

module.exports = new RegistrationService();
