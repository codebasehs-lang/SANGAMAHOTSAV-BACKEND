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
        'DONATION',
        'CUSTOM',
        'NOT_STAYING'
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'sms_campaigns',
      { type: 'CUSTOM' },
      { type: 'NOT_STAYING' }
    );
    await queryInterface.changeColumn('sms_campaigns', 'type', {
      type: Sequelize.ENUM(
        'ACCOMMODATION',
        'REMINDER_7_DAY',
        'REMINDER_2_DAY',
        'PAYMENT_CONFIRMED',
        'DONATION',
        'CUSTOM'
      ),
      allowNull: false,
    });
  },
};
