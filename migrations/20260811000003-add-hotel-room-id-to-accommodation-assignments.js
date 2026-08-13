'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('accommodation_assignments', 'hotel_room_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'hotel_rooms',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'room_number',
    });

    await queryInterface.addIndex('accommodation_assignments', ['hotel_room_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('accommodation_assignments', ['hotel_room_id']);
    await queryInterface.removeColumn('accommodation_assignments', 'hotel_room_id');
  },
};