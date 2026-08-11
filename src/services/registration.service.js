const registrationRepository = require('../repositories/registration.repository');
const accommodationService = require('./accommodation.service');
const excelService = require('./excel.service');
const smsService = require('./sms.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const messages = require('../constants/messages');
const password = require('../utils/password');
const { getPagination, buildMeta } = require('../utils/pagination');
const { ACCOMMODATION_STATUS, NON_ATTENDING_TYPE, PAYMENT_STATUS } = require('../constants/enums');

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

    const selectedAccommodation =
      data.sharedAccommodation || data.familyAccommodation || null;
    const selectedAccommodationField = data.sharedAccommodation
      ? 'sharedAccommodation'
      : data.familyAccommodation
        ? 'familyAccommodation'
        : null;

    await accommodationService.ensureSelectionAllowed({
      accommodationType: selectedAccommodation,
      gender: data.gender,
      fieldName: selectedAccommodationField,
    });

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

    // Devotees who selected a no-stay contribution do not need a room.
    if (
      data.nonAttendingType === NON_ATTENDING_TYPE.NON_ATTENDING ||
      data.nonAttendingType === NON_ATTENDING_TYPE.ATTENDING_NOT_STAYING
    ) {
      data.accommodationStatus = ACCOMMODATION_STATUS.NOT_REQUIRED;
    } else {
      data.accommodationStatus = ACCOMMODATION_STATUS.PENDING;
    }

    if (!data.passwordHash && data.mobileNumber && data.age !== undefined && data.age !== null) {
      data.passwordHash = await password.hash(`${data.mobileNumber}#${data.age}`);
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

  /** Admin: approve payment for a registration. */
  async approvePayment(id, adminId) {
    const registration = await this.getById(id);
    if (registration.paymentStatus === PAYMENT_STATUS.APPROVED) {
      return registration; // already approved, idempotent
    }
    await registrationRepository.update(id, { paymentStatus: PAYMENT_STATUS.APPROVED });
    const updated = await this.getById(id);
    // Fire-and-forget — don't let a delivery failure break the approval
    smsService.sendPaymentConfirmation(updated, adminId).catch((err) => {
      logger.error('Payment confirmation WhatsApp dispatch failed', {
        registrationId: updated.id,
        mobileNumber: updated.mobileNumber,
        error: err.message,
      });
    });
    return updated;
  }

  /** Admin: unapprove (revert) payment for a registration. */
  async unapprovePayment(id) {
    const registration = await this.getById(id);
    if (registration.paymentStatus === PAYMENT_STATUS.PENDING) {
      return registration; // already pending, idempotent
    }
    await registrationRepository.update(id, { paymentStatus: PAYMENT_STATUS.PENDING });
    return this.getById(id);
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
