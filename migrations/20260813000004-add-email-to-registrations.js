'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'email', {
      type: Sequelize.STRING(254),
      allowNull: true,
      after: 'mobile_number',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'email');
  },
};
