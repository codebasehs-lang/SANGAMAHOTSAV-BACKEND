'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'gender', {
      type: Sequelize.ENUM('MALE', 'FEMALE'),
      allowNull: true,
      after: 'facilitator_name',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'gender');
  },
};
