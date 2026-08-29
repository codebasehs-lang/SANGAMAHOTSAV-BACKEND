const registrationRepository = require('../repositories/registration.repository');
const accommodationService = require('./accommodation.service');
const excelService = require('./excel.service');
const smsService = require('./sms.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const messages = require('../constants/messages');
const password = require('../utils/password');
const crypto = require('crypto');
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
    data.checkinToken = crypto.randomBytes(24).toString('hex');

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

  async lookupAttendance({ token, search, status }) {
    if (token) {
      const registration = await registrationRepository.findByCheckinToken(token.trim());
      if (!registration) throw ApiError.notFound('Registration QR code was not found.');
      return [registration];
    }
    return registrationRepository.searchForAttendance(search?.trim(), status);
  }

  async updateAttendance(id, { action, memberIndexes = [] }, adminId) {
    const registration = await this.getById(id);
    const selectedIndexes = [...new Set((Array.isArray(memberIndexes) ? memberIndexes : []).map(Number))];
    const familyMembers = Array.isArray(registration.familyMembers)
      ? registration.familyMembers.map((member) => ({ ...member }))
      : [];

    if (selectedIndexes.some((index) => !Number.isInteger(index) || index < 0 || index >= familyMembers.length)) {
      throw ApiError.badRequest('One or more family members were not found.');
    }

    const now = new Date();
    const update = { familyMembers };

    if (action === 'CHECK_IN') {
      update.attendanceStatus = familyMembers.length && selectedIndexes.length < familyMembers.length
        ? 'PARTIALLY_ARRIVED'
        : 'CHECKED_IN';
      update.checkedInAt = registration.checkedInAt || now;
      update.checkedInBy = registration.checkedInBy || adminId;
      selectedIndexes.forEach((index) => {
        familyMembers[index].checkedIn = true;
        familyMembers[index].checkedInAt = now;
        familyMembers[index].checkedInBy = adminId;
      });
    } else if (action === 'GIVE_KEY') {
      update.hotelKeyGiven = true;
      update.hotelKeyGivenAt = now;
      update.hotelKeyGivenBy = adminId;
    } else if (action === 'RETURN_KEY') {
      update.hotelKeyReturned = true;
      update.hotelKeyReturnedAt = now;
      update.hotelKeyReturnedBy = adminId;
    } else if (action === 'CHECK_OUT') {
      update.attendanceStatus = 'CHECKED_OUT';
      update.checkedOutAt = now;
      update.checkedOutBy = adminId;
      selectedIndexes.forEach((index) => {
        familyMembers[index].checkedOut = true;
        familyMembers[index].checkedOutAt = now;
        familyMembers[index].checkedOutBy = adminId;
      });
    } else {
      throw ApiError.badRequest('Unsupported attendance action.');
    }

    await registrationRepository.update(id, update);
    return this.getById(id);
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

  /** Admin: get list of children (age <= maxAge) with gift status */
  async getChildren(query = {}) {
    const search = (query.search || '').trim().toLowerCase();
    const giftStatus = (query.giftStatus || '').toUpperCase();
    const genderFilter = (query.gender || '').toUpperCase();
    const ageGroupFilter = query.ageGroup || '';
    const maxAge = Number(query.maxAge) || 16;
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 20);

    const rows = await registrationRepository.findAllForChildren();

    const allChildren = [];
    let totalSystemChildren = 0;
    let giftsGivenCount = 0;
    let giftsPendingCount = 0;
    let maleCount = 0;
    let femaleCount = 0;

    for (const r of rows) {
      const plain = typeof r.get === 'function' ? r.get({ plain: true }) : r;

      // 1. Check main registrant
      if (plain.age !== null && plain.age !== undefined && Number(plain.age) <= maxAge) {
        const giftGiven = Boolean(plain.giftGiven);
        totalSystemChildren += 1;
        if (giftGiven) giftsGivenCount += 1;
        else giftsPendingCount += 1;

        const g = String(plain.gender || '').toUpperCase();
        if (g === 'MALE') maleCount += 1;
        else if (g === 'FEMALE') femaleCount += 1;

        allChildren.push({
          id: `reg-${plain.id}-main`,
          registrationId: plain.id,
          personType: 'MAIN',
          memberIndex: null,
          childName: plain.name,
          age: Number(plain.age),
          gender: plain.gender || null,
          parentName: plain.name,
          mobileNumber: plain.mobileNumber,
          relationship: 'Main Registrant',
          comingFrom: plain.comingFrom || '',
          devoteeCategory: plain.devoteeCategory || '',
          attendanceStatus: plain.attendanceStatus || 'NOT_ARRIVED',
          giftGiven,
          giftGivenAt: plain.giftGivenAt || null,
          giftGivenBy: plain.giftGivenBy || null,
          createdAt: plain.createdAt,
        });
      }

      // 2. Check family members
      const familyMembers = Array.isArray(plain.familyMembers) ? plain.familyMembers : [];
      familyMembers.forEach((member, index) => {
        if (!member || !member.name) return;
        const memberAge = member.age !== null && member.age !== undefined ? Number(member.age) : NaN;
        if (!isNaN(memberAge) && memberAge <= maxAge) {
          const giftGiven = Boolean(member.giftGiven);
          totalSystemChildren += 1;
          if (giftGiven) giftsGivenCount += 1;
          else giftsPendingCount += 1;

          const g = String(member.gender || '').toUpperCase();
          if (g === 'MALE') maleCount += 1;
          else if (g === 'FEMALE') femaleCount += 1;

          allChildren.push({
            id: `reg-${plain.id}-fm-${index}`,
            registrationId: plain.id,
            personType: 'FAMILY_MEMBER',
            memberIndex: index,
            childName: member.name,
            age: memberAge,
            gender: member.gender || null,
            parentName: plain.name,
            mobileNumber: plain.mobileNumber,
            relationship: member.relationship || 'Family Member',
            comingFrom: plain.comingFrom || '',
            devoteeCategory: member.devoteeCategory || plain.devoteeCategory || '',
            attendanceStatus: plain.attendanceStatus || 'NOT_ARRIVED',
            giftGiven,
            giftGivenAt: member.giftGivenAt || null,
            giftGivenBy: member.giftGivenBy || null,
            createdAt: plain.createdAt,
          });
        }
      });
    }

    // Filter
    let filtered = allChildren;

    if (search) {
      filtered = filtered.filter((c) => {
        return (
          c.childName.toLowerCase().includes(search) ||
          c.parentName.toLowerCase().includes(search) ||
          c.mobileNumber.toLowerCase().includes(search) ||
          (c.comingFrom && c.comingFrom.toLowerCase().includes(search)) ||
          (c.relationship && c.relationship.toLowerCase().includes(search))
        );
      });
    }

    if (giftStatus === 'GIVEN' || giftStatus === 'YES') {
      filtered = filtered.filter((c) => c.giftGiven === true);
    } else if (giftStatus === 'PENDING' || giftStatus === 'NO') {
      filtered = filtered.filter((c) => c.giftGiven === false);
    }

    if (genderFilter === 'MALE' || genderFilter === 'FEMALE') {
      filtered = filtered.filter((c) => String(c.gender).toUpperCase() === genderFilter);
    }

    if (ageGroupFilter === '0-5') {
      filtered = filtered.filter((c) => c.age >= 0 && c.age <= 5);
    } else if (ageGroupFilter === '6-12') {
      filtered = filtered.filter((c) => c.age >= 6 && c.age <= 12);
    } else if (ageGroupFilter === '13-16') {
      filtered = filtered.filter((c) => c.age >= 13 && c.age <= 16);
    }

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      meta: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
      },
      summary: {
        totalChildren: totalSystemChildren,
        giftsGivenCount,
        giftsPendingCount,
        maleCount,
        femaleCount,
      },
    };
  }

  /** Admin: toggle gift given status for a child (main registrant or family member) */
  async updateChildGiftStatus({ registrationId, personType, memberIndex, giftGiven }, adminId) {
    const registration = await registrationRepository.findById(registrationId);
    if (!registration) {
      throw ApiError.notFound('Registration not found.');
    }

    const isGiven = Boolean(giftGiven);
    const now = new Date();

    if (personType === 'MAIN') {
      await registrationRepository.update(registrationId, {
        giftGiven: isGiven,
        giftGivenAt: isGiven ? now : null,
        giftGivenBy: isGiven ? adminId : null,
      });
    } else if (personType === 'FAMILY_MEMBER') {
      const familyMembers = Array.isArray(registration.familyMembers)
        ? [...registration.familyMembers]
        : [];
      const idx = Number(memberIndex);
      if (idx < 0 || idx >= familyMembers.length) {
        throw ApiError.badRequest('Family member not found at specified index.');
      }

      familyMembers[idx] = {
        ...familyMembers[idx],
        giftGiven: isGiven,
        giftGivenAt: isGiven ? now.toISOString() : null,
        giftGivenBy: isGiven ? adminId : null,
      };

      await registrationRepository.update(registrationId, { familyMembers });
    } else {
      throw ApiError.badRequest('Invalid personType provided.');
    }

    return { success: true, giftGiven: isGiven };
  }

  /** Admin: export children list to Excel */
  async exportChildrenToExcel(query) {
    const result = await this.getChildren({ ...query, limit: 100000, page: 1 });
    return excelService.buildChildrenWorkbook(result.data);
  }

  _buildOrder(query) {
    const field = SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'created_at';
    const direction =
      String(query.order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return [[field, direction]];
  }
}

module.exports = new RegistrationService();
