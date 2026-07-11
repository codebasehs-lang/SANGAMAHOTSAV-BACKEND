const { Model, DataTypes } = require('sequelize');
const {
  DEVOTEE_CATEGORY,
  NON_ATTENDING_TYPE,
  SHARED_ACCOMMODATION,
  FAMILY_ACCOMMODATION,
  ADDITIONAL_FAMILY_ACCOMMODATION,
  PREFERRED_SUBJECT,
  ACCOMMODATION_STATUS,
  values,
} = require('../constants/enums');

module.exports = (sequelize) => {
  class Registration extends Model {
    static associate(models) {
      Registration.hasOne(models.AccommodationAssignment, {
        foreignKey: 'registrationId',
        as: 'assignment',
        onDelete: 'CASCADE',
      });
      Registration.hasMany(models.SmsLog, {
        foreignKey: 'registrationId',
        as: 'smsLogs',
      });
    }
  }

  Registration.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      // Field 1
      name: { type: DataTypes.STRING(150), allowNull: false },
      age: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 0, max: 120 },
      },
      initiatedName: { type: DataTypes.STRING(150), allowNull: true },
      // Field 2
      devoteeCategory: {
        type: DataTypes.ENUM(...values(DEVOTEE_CATEGORY)),
        allowNull: false,
      },
      // Field 3 — array of { name, age }
      familyMembers: { type: DataTypes.JSON, allowNull: true },
      // Field 4
      mobileNumber: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
      },
      // Field 5
      comingFrom: { type: DataTypes.STRING(150), allowNull: false },
      // Field 6 & 7
      arrivalDate: { type: DataTypes.DATEONLY, allowNull: true },
      arrivalTime: { type: DataTypes.TIME, allowNull: true },
      // Field 8
      nonAttendingType: {
        type: DataTypes.ENUM(...values(NON_ATTENDING_TYPE)),
        allowNull: true,
      },
      // Field 9
      sharedAccommodation: {
        type: DataTypes.ENUM(...values(SHARED_ACCOMMODATION)),
        allowNull: true,
      },
      // Field 10
      familyAccommodation: {
        type: DataTypes.ENUM(...values(FAMILY_ACCOMMODATION)),
        allowNull: true,
      },
      // Field 11
      additionalFamilyAccommodation: {
        type: DataTypes.ENUM(...values(ADDITIONAL_FAMILY_ACCOMMODATION)),
        allowNull: true,
      },
      // Field 12 & 13
      departureDate: { type: DataTypes.DATEONLY, allowNull: true },
      departureTime: { type: DataTypes.TIME, allowNull: true },
      // Field 14
      needJourneyPrasad: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Field 15
      preferredSubject: {
        type: DataTypes.ENUM(...values(PREFERRED_SUBJECT)),
        allowNull: true,
      },
      preferredSubjectOther: { type: DataTypes.STRING(200), allowNull: true },
      // Field 16 — array of service enum keys
      services: { type: DataTypes.JSON, allowNull: true },
      // Field 17
      ownFourWheeler: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Field 19
      amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        validate: { min: 0 },
      },
      // Field 20
      comments: { type: DataTypes.TEXT, allowNull: true },
      // Derived assignment state
      accommodationStatus: {
        type: DataTypes.ENUM(...values(ACCOMMODATION_STATUS)),
        allowNull: false,
        defaultValue: ACCOMMODATION_STATUS.PENDING,
      },
    },
    {
      sequelize,
      modelName: 'Registration',
      tableName: 'registrations',
      underscored: true,
      indexes: [
        { unique: true, fields: ['mobile_number'] },
        { fields: ['accommodation_status'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return Registration;
};
