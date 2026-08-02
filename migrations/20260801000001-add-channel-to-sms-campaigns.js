'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sms_campaigns', 'channel', {
      type: Sequelize.ENUM('SMS', 'WHATSAPP'),
      allowNull: false,
      defaultValue: 'SMS',
      after: 'type',
    });

    await queryInterface.addIndex('sms_campaigns', ['channel'], {
      name: 'idx_camp_channel',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('sms_campaigns', 'idx_camp_channel');
    await queryInterface.removeColumn('sms_campaigns', 'channel');
  },
};
