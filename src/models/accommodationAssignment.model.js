const { Model, DataTypes } = require('sequelize');
const { ASSIGNMENT_STATUS, values } = require('../constants/enums');

module.exports = (sequelize) => {
  class AccommodationAssignment extends Model {
    static associate(models) {
      AccommodationAssignment.belongsTo(models.Registration, {
        foreignKey: 'registrationId',
        as: 'registration',
        onDelete: 'CASCADE',
      });
      AccommodationAssignment.belongsTo(models.Admin, {
        foreignKey: 'assignedBy',
        as: 'assigner',
        onDelete: 'SET NULL',
      });
    }
  }

  AccommodationAssignment.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      registrationId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
      },
      hotelName: { type: DataTypes.STRING(150), allowNull: false },
      hotelAddress: { type: DataTypes.STRING(255), allowNull: false },
      roomNumber: { type: DataTypes.STRING(30), allowNull: false },
      hotelMapLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: { isUrl: true },
      },
      status: {
        type: DataTypes.ENUM(...values(ASSIGNMENT_STATUS)),
        allowNull: false,
        defaultValue: ASSIGNMENT_STATUS.ASSIGNED,
      },
      assignedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      assignedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'AccommodationAssignment',
      tableName: 'accommodation_assignments',
      underscored: true,
      indexes: [
        { unique: true, fields: ['registration_id'] },
        { fields: ['status'] },
      ],
    }
  );

  return AccommodationAssignment;
};
