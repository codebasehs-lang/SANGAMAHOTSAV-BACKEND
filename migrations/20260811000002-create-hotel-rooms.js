'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hotel_rooms', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      hotel_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'hotels',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      room_no: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      room_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      room_capacity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      current_occupancy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('hotel_rooms', ['hotel_id', 'room_no'], {
      unique: true,
      name: 'hotel_rooms_hotel_id_room_no_unique',
    });
    await queryInterface.addIndex('hotel_rooms', ['hotel_id']);
    await queryInterface.addIndex('hotel_rooms', ['room_type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hotel_rooms');
  },
};