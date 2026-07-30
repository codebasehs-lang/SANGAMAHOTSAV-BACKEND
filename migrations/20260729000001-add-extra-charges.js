'use strict';

/**
 * Add `extra_charges` JSON column to registrations to store an array
 * of selected extra charge codes (e.g. ['EXTRA_DEVOTEE','CHILD_12_PLUS']).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('registrations', 'extra_charges', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('registrations', 'extra_charges');
  },
};
