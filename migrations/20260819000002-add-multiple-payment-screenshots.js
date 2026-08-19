'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'payment_screenshot1', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Installment 1 payment screenshot',
    });
    await queryInterface.addColumn('registrations', 'payment_screenshot2', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Installment 2 payment screenshot',
    });
    await queryInterface.addColumn('registrations', 'payment_screenshot3', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Installment 3 payment screenshot',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('registrations', 'payment_screenshot1');
    await queryInterface.removeColumn('registrations', 'payment_screenshot2');
    await queryInterface.removeColumn('registrations', 'payment_screenshot3');
  },
};
