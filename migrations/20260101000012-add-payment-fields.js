'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'payment_reference_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'amount_paid',
    });
    await queryInterface.addColumn('registrations', 'payee_account_name', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'payment_reference_id',
    });
    await queryInterface.addColumn('registrations', 'payment_screenshot', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'payee_account_name',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'payment_reference_id');
    await queryInterface.removeColumn('registrations', 'payee_account_name');
    await queryInterface.removeColumn('registrations', 'payment_screenshot');
  },
};
