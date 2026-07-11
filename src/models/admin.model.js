const { Model, DataTypes } = require('sequelize');
const { ADMIN_ROLE, values } = require('../constants/enums');

module.exports = (sequelize) => {
  class Admin extends Model {
    static associate(models) {
      Admin.hasMany(models.SmsCampaign, {
        foreignKey: 'triggeredBy',
        as: 'campaigns',
      });
    }
  }

  Admin.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(...values(ADMIN_ROLE)),
        allowNull: false,
        defaultValue: ADMIN_ROLE.ADMIN,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Admin',
      tableName: 'admins',
      underscored: true,
      defaultScope: {
        attributes: { exclude: ['passwordHash'] },
      },
      scopes: {
        withPassword: { attributes: { include: ['passwordHash'] } },
      },
    }
  );

  return Admin;
};
