'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('admins', 'role', {
      type: Sequelize.ENUM('ADMIN', 'VIEWER'),
      allowNull: false,
      defaultValue: 'ADMIN',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('admins', 'role', {
      type: Sequelize.ENUM('ADMIN'),
      allowNull: false,
      defaultValue: 'ADMIN',
    });
  },
};
