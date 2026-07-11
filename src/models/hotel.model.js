const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Hotel extends Model {
    static associate() {}
  }

  Hotel.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      hotelName: { type: DataTypes.STRING(150), allowNull: false },
      hotelAddress: { type: DataTypes.STRING(255), allowNull: false },
      hotelMapLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: { isUrl: true },
      },
    },
    {
      sequelize,
      modelName: 'Hotel',
      tableName: 'hotels',
      underscored: true,
    }
  );

  return Hotel;
};
