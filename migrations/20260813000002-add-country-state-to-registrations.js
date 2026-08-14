'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'country', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'coming_from',
    });
    await queryInterface.addColumn('registrations', 'state', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'country',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'state');
    await queryInterface.removeColumn('registrations', 'country');
  },
};
