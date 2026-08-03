'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'mobile_number',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'password_hash');
  },
};
