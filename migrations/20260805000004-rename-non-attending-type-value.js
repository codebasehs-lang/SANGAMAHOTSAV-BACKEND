'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('registrations', 'non_attending_type', {
      type: Sequelize.ENUM(
        'NON_ATTENDING_DISCIPLE',
        'ATTENDING_NOT_STAYING',
        'NON_ATTENDING'
      ),
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      "UPDATE registrations SET non_attending_type = 'NON_ATTENDING' WHERE non_attending_type IN ('ATTENDING_NOT_STAYING', 'NON_ATTENDING_DISCIPLE')"
    );

    await queryInterface.changeColumn('registrations', 'non_attending_type', {
      type: Sequelize.ENUM('NON_ATTENDING'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('registrations', 'non_attending_type', {
      type: Sequelize.ENUM('NON_ATTENDING_DISCIPLE', 'ATTENDING_NOT_STAYING', 'NON_ATTENDING'),
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      "UPDATE registrations SET non_attending_type = 'ATTENDING_NOT_STAYING' WHERE non_attending_type = 'NON_ATTENDING'"
    );

    await queryInterface.changeColumn('registrations', 'non_attending_type', {
      type: Sequelize.ENUM('NON_ATTENDING_DISCIPLE', 'ATTENDING_NOT_STAYING'),
      allowNull: true,
    });
  },
};
