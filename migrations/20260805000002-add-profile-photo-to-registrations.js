'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'profile_photo', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'payment_screenshot',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'profile_photo');
  },
};
