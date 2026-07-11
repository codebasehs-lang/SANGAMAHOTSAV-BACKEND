const { Model, DataTypes } = require('sequelize');
const {
  SMS_CAMPAIGN_TYPE,
  SMS_CAMPAIGN_STATUS,
  values,
} = require('../constants/enums');

module.exports = (sequelize) => {
  class SmsCampaign extends Model {
    static associate(models) {
      SmsCampaign.belongsTo(models.Admin, {
        foreignKey: 'triggeredBy',
        as: 'admin',
        onDelete: 'RESTRICT',
      });
      SmsCampaign.belongsTo(models.SeminarHall, {
        foreignKey: 'seminarHallId',
        as: 'seminarHall',
        onDelete: 'SET NULL',
      });
      SmsCampaign.hasMany(models.SmsLog, {
        foreignKey: 'campaignId',
        as: 'logs',
        onDelete: 'CASCADE',
      });
    }
  }

  SmsCampaign.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.ENUM(...values(SMS_CAMPAIGN_TYPE)),
        allowNull: false,
      },
      messageTemplate: { type: DataTypes.TEXT, allowNull: false },
      seminarHallId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      totalRecipients: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      sentCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      failedCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM(...values(SMS_CAMPAIGN_STATUS)),
        allowNull: false,
        defaultValue: SMS_CAMPAIGN_STATUS.PENDING,
      },
      triggeredBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SmsCampaign',
      tableName: 'sms_campaigns',
      underscored: true,
      indexes: [{ fields: ['type'] }, { fields: ['created_at'] }],
    }
  );

  return SmsCampaign;
};
