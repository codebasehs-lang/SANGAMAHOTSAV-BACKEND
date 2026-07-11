const { Model, DataTypes } = require('sequelize');
const { SMS_LOG_STATUS, values } = require('../constants/enums');

module.exports = (sequelize) => {
  class SmsLog extends Model {
    static associate(models) {
      SmsLog.belongsTo(models.SmsCampaign, {
        foreignKey: 'campaignId',
        as: 'campaign',
        onDelete: 'CASCADE',
      });
      SmsLog.belongsTo(models.Registration, {
        foreignKey: 'registrationId',
        as: 'registration',
        onDelete: 'SET NULL',
      });
    }
  }

  SmsLog.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      campaignId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      registrationId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      mobileNumber: { type: DataTypes.STRING(15), allowNull: false },
      renderedMessage: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM(...values(SMS_LOG_STATUS)),
        allowNull: false,
      },
      providerMessageId: { type: DataTypes.STRING(100), allowNull: true },
      errorMessage: { type: DataTypes.TEXT, allowNull: true },
      sentAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'SmsLog',
      tableName: 'sms_logs',
      underscored: true,
      updatedAt: false,
      indexes: [
        { fields: ['campaign_id'] },
        { fields: ['status'] },
        { fields: ['mobile_number'] },
      ],
    }
  );

  return SmsLog;
};
