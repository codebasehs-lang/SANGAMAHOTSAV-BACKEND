'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'payment_status', {
      type: Sequelize.ENUM('PENDING', 'APPROVED'),
      allowNull: false,
      defaultValue: 'PENDING',
      after: 'payment_screenshot',
    });
    await queryInterface.addIndex('registrations', ['payment_status'], {
      name: 'idx_reg_payment_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('registrations', 'idx_reg_payment_status');
    await queryInterface.removeColumn('registrations', 'payment_status');
  },
};
