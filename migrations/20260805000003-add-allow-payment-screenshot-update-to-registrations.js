'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'allow_payment_screenshot_update', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'payment_screenshot',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'allow_payment_screenshot_update');
  },
};
