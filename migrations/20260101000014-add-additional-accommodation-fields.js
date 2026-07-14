'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('accommodation_assignments', 'additional_hotel_name', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'hotel_map_link',
    });
    await queryInterface.addColumn('accommodation_assignments', 'additional_hotel_address', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'additional_hotel_name',
    });
    await queryInterface.addColumn('accommodation_assignments', 'additional_room_number', {
      type: Sequelize.STRING(30),
      allowNull: true,
      after: 'additional_hotel_address',
    });
    await queryInterface.addColumn('accommodation_assignments', 'additional_hotel_map_link', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'additional_room_number',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('accommodation_assignments', 'additional_hotel_name');
    await queryInterface.removeColumn('accommodation_assignments', 'additional_hotel_address');
    await queryInterface.removeColumn('accommodation_assignments', 'additional_room_number');
    await queryInterface.removeColumn('accommodation_assignments', 'additional_hotel_map_link');
  },
};
