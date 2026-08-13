const { Model, DataTypes } = require('sequelize');
const { ROOM_TYPE, values } = require('../constants/enums');

module.exports = (sequelize) => {
  class HotelRoom extends Model {
    static associate(models) {
      HotelRoom.belongsTo(models.Hotel, {
        foreignKey: 'hotelId',
        as: 'hotel',
        onDelete: 'CASCADE',
      });
      HotelRoom.hasMany(models.AccommodationAssignment, {
        foreignKey: 'hotelRoomId',
        as: 'assignments',
      });
    }
  }

  HotelRoom.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      hotelId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      roomNo: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      roomType: {
        type: DataTypes.ENUM(...values(ROOM_TYPE)),
        allowNull: false,
      },
      roomCapacity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      currentOccupancy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'HotelRoom',
      tableName: 'hotel_rooms',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['hotel_id', 'room_no'],
        },
        { fields: ['hotel_id'] },
        { fields: ['room_type'] },
      ],
    }
  );

  return HotelRoom;
};