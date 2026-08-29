'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = [
      ['gift_given', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
      ['gift_given_at', { type: Sequelize.DATE, allowNull: true }],
      ['gift_given_by', { type: Sequelize.BIGINT.UNSIGNED, allowNull: true }],
    ];

    for (const [name, definition] of columns) {
      try {
        await queryInterface.addColumn('registrations', name, definition);
      } catch (error) {
        console.log(`${name} already exists or could not be added:`, error.message);
      }
    }
  },

  async down(queryInterface) {
    const columns = ['gift_given', 'gift_given_at', 'gift_given_by'];
    for (const column of columns) {
      await queryInterface.removeColumn('registrations', column).catch(() => {});
    }
  },
};
