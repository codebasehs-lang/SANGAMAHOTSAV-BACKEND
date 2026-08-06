'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('registrations', 'non_attending_type', {
      type: Sequelize.ENUM('ATTENDING_NOT_STAYING', 'NON_ATTENDING'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "UPDATE registrations SET non_attending_type = 'NON_ATTENDING' WHERE non_attending_type = 'ATTENDING_NOT_STAYING'"
    );

    await queryInterface.changeColumn('registrations', 'non_attending_type', {
      type: Sequelize.ENUM('NON_ATTENDING'),
      allowNull: true,
    });
  },
};
