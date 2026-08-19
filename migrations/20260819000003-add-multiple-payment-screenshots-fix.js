'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('registrations', 'payment_screenshot1', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Installment 1 payment screenshot',
      });
    } catch (err) {
      // Column might already exist, ignore
      console.log('payment_screenshot1 column already exists or error:', err.message);
    }
    
    try {
      await queryInterface.addColumn('registrations', 'payment_screenshot2', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Installment 2 payment screenshot',
      });
    } catch (err) {
      console.log('payment_screenshot2 column already exists or error:', err.message);
    }
    
    try {
      await queryInterface.addColumn('registrations', 'payment_screenshot3', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Installment 3 payment screenshot',
      });
    } catch (err) {
      console.log('payment_screenshot3 column already exists or error:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('registrations', 'payment_screenshot1').catch(() => {});
    await queryInterface.removeColumn('registrations', 'payment_screenshot2').catch(() => {});
    await queryInterface.removeColumn('registrations', 'payment_screenshot3').catch(() => {});
  },
};
