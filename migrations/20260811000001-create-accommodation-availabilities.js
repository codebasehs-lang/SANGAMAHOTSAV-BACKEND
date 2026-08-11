'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('accommodation_availabilities', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      accommodation_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM('MALE', 'FEMALE', 'ALL'),
        allowNull: false,
        defaultValue: 'ALL',
      },
      is_open: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status_message: {
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

    await queryInterface.addIndex(
      'accommodation_availabilities',
      ['accommodation_type', 'gender'],
      {
        unique: true,
        name: 'accommodation_availabilities_type_gender_unique',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('accommodation_availabilities');
  },
};