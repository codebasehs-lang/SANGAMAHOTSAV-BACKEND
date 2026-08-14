'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'district', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'state',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'district');
  },
};
