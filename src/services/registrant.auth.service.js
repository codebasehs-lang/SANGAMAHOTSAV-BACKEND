const registrationRepository = require('../repositories/registration.repository');
const smsRepository = require('../repositories/sms.repository');
const seminarHallService = require('./seminarHall.service');
const password = require('../utils/password');
const jwt = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');

class RegistrantAuthService {
  async _verifyPassword(registration, plainPassword) {
    const expectedPassword = `${registration.mobileNumber}#${registration.age}`;
    const passwordHash = registration.passwordHash || '';

    if (passwordHash) {
      return password.compare(plainPassword, passwordHash);
    }

    return plainPassword === expectedPassword;
  }

  async login({ mobileNumber, password: plainPassword }) {
    const normalizedMobile = `${mobileNumber || ''}`.trim();
    const registration = await registrationRepository.findByMobile(normalizedMobile);

    if (!registration) {
      throw ApiError.unauthorized(messages.INVALID_CREDENTIALS);
    }

    const isMatch = await this._verifyPassword(registration, plainPassword);

    if (!isMatch) {
      throw ApiError.unauthorized(messages.INVALID_CREDENTIALS);
    }

    const token = jwt.sign({
      sub: registration.id,
      mobileNumber: registration.mobileNumber,
      role: 'registrant',
      name: registration.initiatedName || registration.name,
    });

    return {
      token,
      registrant: {
        id: registration.id,
        name: registration.initiatedName || registration.name,
        mobileNumber: registration.mobileNumber,
        age: registration.age,
        role: 'registrant',
      },
    };
  }

  async changePassword(registrationId, { currentPassword, newPassword }) {
    const registration = await registrationRepository.findById(registrationId);
    if (!registration) {
      throw ApiError.notFound(messages.NOT_FOUND);
    }

    const isMatch = await this._verifyPassword(registration, currentPassword);

    if (!isMatch) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    if (!newPassword || newPassword.trim().length < 4) {
      throw ApiError.badRequest('New password must be at least 4 characters');
    }

    const hashed = await password.hash(newPassword.trim());
    await registrationRepository.update(registrationId, { passwordHash: hashed });

    return { success: true };
  }

  async updateProfilePhoto(registrationId, profilePhotoPath) {
    const registration = await registrationRepository.findById(registrationId);
    if (!registration) {
      throw ApiError.notFound(messages.NOT_FOUND);
    }

    await registrationRepository.update(registrationId, {
      profilePhoto: profilePhotoPath,
    });

    return { profilePhoto: profilePhotoPath };
  }

  async updatePaymentScreenshot(registrationId, paymentScreenshotPath) {
    const registration = await registrationRepository.findById(registrationId);
    if (!registration) {
      throw ApiError.notFound(messages.NOT_FOUND);
    }

    if (registration.paymentScreenshot && !registration.allowPaymentScreenshotUpdate) {
      throw ApiError.forbidden(
        'Payment screenshot update is currently disabled. Please contact admin.'
      );
    }

    await registrationRepository.update(registrationId, {
      paymentScreenshot: paymentScreenshotPath,
      allowPaymentScreenshotUpdate: false,
    });

    return {
      paymentScreenshot: paymentScreenshotPath,
      allowPaymentScreenshotUpdate: false,
    };
  }

  async getProfile(registrationId) {
    const registration = await registrationRepository.findByIdWithAssignment(registrationId);
    if (!registration) {
      throw ApiError.notFound(messages.NOT_FOUND);
    }

    const noticeBoardMessages = await smsRepository.findNoticeBoardMessages({ limit: 5 });
    const activeSeminarHall = await seminarHallService.getActive();

    return {
      id: registration.id,
      name: registration.name,
      initiatedName: registration.initiatedName,
      age: registration.age,
      devoteeCategory: registration.devoteeCategory,
      mobileNumber: registration.mobileNumber,
      comingFrom: registration.comingFrom,
      facilitatorName: registration.facilitatorName,
      gender: registration.gender,
      arrivalDate: registration.arrivalDate,
      arrivalTime: registration.arrivalTime,
      departureDate: registration.departureDate,
      departureTime: registration.departureTime,
      needJourneyPrasad: registration.needJourneyPrasad,
      preferredSubject: registration.preferredSubject,
      preferredSubjectOther: registration.preferredSubjectOther,
      services: registration.services,
      donationItems: registration.donationItems,
      extraCharges: registration.extraCharges,
      ownFourWheeler: registration.ownFourWheeler,
      amountPaid: registration.amountPaid,
      paymentReferenceId: registration.paymentReferenceId,
      payeeAccountName: registration.payeeAccountName,
      paymentScreenshot: registration.paymentScreenshot,
      allowPaymentScreenshotUpdate: registration.allowPaymentScreenshotUpdate,
      profilePhoto: registration.profilePhoto,
      paymentStatus: registration.paymentStatus,
      accommodationStatus: registration.accommodationStatus,
      comments: registration.comments,
      assignment: registration.assignment || null,
      seminarHall: activeSeminarHall
        ? {
            hallName: activeSeminarHall.hallName,
            hallAddress: activeSeminarHall.hallAddress,
            hallMapLink: activeSeminarHall.hallMapLink,
          }
        : null,
      noticeBoardMessages: noticeBoardMessages.map((item) => ({
        id: item.id,
        message: item.messageTemplate,
        createdAt: item.createdAt,
      })),
    };
  }
}

module.exports = new RegistrantAuthService();
