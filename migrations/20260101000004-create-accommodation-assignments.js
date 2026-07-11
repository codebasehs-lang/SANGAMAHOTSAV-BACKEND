'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('accommodation_assignments', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      registration_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'registrations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      hotel_name: { type: Sequelize.STRING(150), allowNull: false },
      hotel_address: { type: Sequelize.STRING(255), allowNull: false },
      room_number: { type: Sequelize.STRING(30), allowNull: false },
      hotel_map_link: { type: Sequelize.STRING(500), allowNull: true },
      status: {
        type: Sequelize.ENUM('PENDING', 'ASSIGNED'),
        allowNull: false,
        defaultValue: 'ASSIGNED',
      },
      assigned_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'admins', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      assigned_at: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('accommodation_assignments', ['status'], {
      name: 'idx_acc_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('accommodation_assignments');
  },
};
