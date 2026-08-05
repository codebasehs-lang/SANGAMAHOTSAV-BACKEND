'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('sms_campaigns', 'channel', {
      type: Sequelize.ENUM('SMS', 'WHATSAPP', 'APPLICATION'),
      allowNull: false,
      defaultValue: 'SMS',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('sms_campaigns', 'channel', {
      type: Sequelize.ENUM('SMS', 'WHATSAPP'),
      allowNull: false,
      defaultValue: 'SMS',
    });
  },
};
