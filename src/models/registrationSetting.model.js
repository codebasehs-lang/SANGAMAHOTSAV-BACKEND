const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RegistrationSetting extends Model {}

  RegistrationSetting.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      isOpen: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      closedMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'RegistrationSetting',
      tableName: 'registration_settings',
      underscored: true,
    }
  );

  return RegistrationSetting;
};
