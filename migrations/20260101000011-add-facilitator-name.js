'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'facilitator_name', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'coming_from',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'facilitator_name');
  },
};
