'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make coming_from nullable
    await queryInterface.changeColumn('registrations', 'coming_from', {
      type: Sequelize.STRING(150),
      allowNull: true,
    });

    // Make email nullable
    await queryInterface.changeColumn('registrations', 'email', {
      type: Sequelize.STRING(254),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert coming_from to NOT NULL
    await queryInterface.changeColumn('registrations', 'coming_from', {
      type: Sequelize.STRING(150),
      allowNull: false,
    });

    // Revert email to NOT NULL
    await queryInterface.changeColumn('registrations', 'email', {
      type: Sequelize.STRING(254),
      allowNull: false,
    });
  },
};
