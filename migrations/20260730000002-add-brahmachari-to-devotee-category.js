'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('registrations', 'devotee_category', {
      type: Sequelize.ENUM('DISCIPLE', 'NON_DISCIPLE', 'BRAHMACHARI'),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('registrations', 'devotee_category', {
      type: Sequelize.ENUM('DISCIPLE', 'NON_DISCIPLE'),
      allowNull: false,
    });
  },
};
