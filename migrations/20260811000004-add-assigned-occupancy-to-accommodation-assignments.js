'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('accommodation_assignments', 'assigned_occupancy', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      after: 'hotel_room_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('accommodation_assignments', 'assigned_occupancy');
  },
};