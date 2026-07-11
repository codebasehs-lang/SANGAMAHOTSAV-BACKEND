const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SeminarHall extends Model {
    static associate(models) {
      SeminarHall.hasMany(models.SmsCampaign, {
        foreignKey: 'seminarHallId',
        as: 'campaigns',
      });
    }
  }

  SeminarHall.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      hallName: { type: DataTypes.STRING(150), allowNull: false },
      hallAddress: { type: DataTypes.STRING(255), allowNull: false },
      hallMapLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: { isUrl: true },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      /**
       * Generated column: 1 when active, NULL otherwise.
       * A UNIQUE index on this column enforces "only one active hall".
       */
      activeFlag: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.isActive ? 1 : null;
        },
      },
    },
    {
      sequelize,
      modelName: 'SeminarHall',
      tableName: 'seminar_halls',
      underscored: true,
    }
  );

  return SeminarHall;
};
