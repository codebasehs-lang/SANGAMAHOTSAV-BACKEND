'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('sms_campaigns', 'type', {
      type: Sequelize.ENUM(
        'ACCOMMODATION',
        'REMINDER_7_DAY',
        'REMINDER_2_DAY',
        'PAYMENT_CONFIRMED',
        'CUSTOM'
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('sms_campaigns', 'type', {
      type: Sequelize.ENUM(
        'ACCOMMODATION',
        'REMINDER_7_DAY',
        'REMINDER_2_DAY',
        'CUSTOM'
      ),
      allowNull: false,
    });
  },
};
