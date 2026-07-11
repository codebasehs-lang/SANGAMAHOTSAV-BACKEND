'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('seminar_halls', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      hall_name: { type: Sequelize.STRING(150), allowNull: false },
      hall_address: { type: Sequelize.STRING(255), allowNull: false },
      hall_map_link: { type: Sequelize.STRING(500), allowNull: true },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    // Generated column + unique index => at most one active hall.
    await queryInterface.sequelize.query(
      'ALTER TABLE `seminar_halls` ADD COLUMN `active_flag` TINYINT(1) ' +
        'GENERATED ALWAYS AS (IF(`is_active` = 1, 1, NULL)) STORED'
    );
    await queryInterface.addIndex('seminar_halls', ['active_flag'], {
      name: 'uk_hall_active',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('seminar_halls');
  },
};
