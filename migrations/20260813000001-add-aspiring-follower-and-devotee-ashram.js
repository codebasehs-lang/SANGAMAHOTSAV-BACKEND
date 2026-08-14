'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Extend devotee_category enum with ASPIRING and FOLLOWER (BRAHMACHARI kept for existing data)
    await queryInterface.sequelize.query(
      "ALTER TABLE `registrations` MODIFY COLUMN `devotee_category` ENUM('DISCIPLE','NON_DISCIPLE','BRAHMACHARI','ASPIRING','FOLLOWER') NOT NULL;"
    );

    // New optional devotee_ashram column
    await queryInterface.addColumn('registrations', 'devotee_ashram', {
      type: Sequelize.ENUM('GRIHASTHA', 'BRAHMACHARI', 'ASPIRING'),
      allowNull: true,
      after: 'devotee_category',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'devotee_ashram');
    await queryInterface.sequelize.query(
      "ALTER TABLE `registrations` MODIFY COLUMN `devotee_category` ENUM('DISCIPLE','NON_DISCIPLE','BRAHMACHARI') NOT NULL;"
    );
  },
};
