const { Model, DataTypes } = require('sequelize');
const {
  SHARED_ACCOMMODATION,
  FAMILY_ACCOMMODATION,
  ACCOMMODATION_AVAILABILITY_GENDER,
  values,
} = require('../constants/enums');

const ACCOMMODATION_TYPES = [
  ...values(SHARED_ACCOMMODATION),
  ...values(FAMILY_ACCOMMODATION),
];

module.exports = (sequelize) => {
  class AccommodationAvailability extends Model {}

  AccommodationAvailability.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      accommodationType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [ACCOMMODATION_TYPES],
        },
      },
      gender: {
        type: DataTypes.ENUM(...values(ACCOMMODATION_AVAILABILITY_GENDER)),
        allowNull: false,
        defaultValue: ACCOMMODATION_AVAILABILITY_GENDER.ALL,
      },
      isOpen: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      statusMessage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AccommodationAvailability',
      tableName: 'accommodation_availabilities',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['accommodation_type', 'gender'],
        },
      ],
    }
  );

  return AccommodationAvailability;
};