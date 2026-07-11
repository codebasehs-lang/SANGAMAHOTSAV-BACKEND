'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedbacks', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      mobile_number: { type: Sequelize.STRING(15), allowNull: false },
      overall_rating: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
      suggestions: { type: Sequelize.TEXT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('feedbacks', ['mobile_number'], {
      name: 'idx_fb_mobile',
    });
    await queryInterface.addIndex('feedbacks', ['created_at'], {
      name: 'idx_fb_created',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('feedbacks');
  },
};
