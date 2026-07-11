const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Feedback extends Model {
    static associate() {
      // Standalone table — no associations in V1.
    }
  }

  Feedback.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: DataTypes.STRING(150), allowNull: false },
      mobileNumber: { type: DataTypes.STRING(15), allowNull: false },
      overallRating: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      suggestions: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Feedback',
      tableName: 'feedbacks',
      underscored: true,
      updatedAt: false,
      indexes: [{ fields: ['mobile_number'] }, { fields: ['created_at'] }],
    }
  );

  return Feedback;
};
