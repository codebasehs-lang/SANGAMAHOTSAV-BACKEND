'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = [
      ['checkin_token', { type: Sequelize.STRING(64), allowNull: true, unique: true }],
      ['attendance_status', { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'NOT_ARRIVED' }],
      ['checked_in_at', { type: Sequelize.DATE, allowNull: true }],
      ['checked_in_by', { type: Sequelize.BIGINT.UNSIGNED, allowNull: true }],
      ['checked_out_at', { type: Sequelize.DATE, allowNull: true }],
      ['checked_out_by', { type: Sequelize.BIGINT.UNSIGNED, allowNull: true }],
      ['hotel_key_given', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
      ['hotel_key_given_at', { type: Sequelize.DATE, allowNull: true }],
      ['hotel_key_given_by', { type: Sequelize.BIGINT.UNSIGNED, allowNull: true }],
      ['hotel_key_returned', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }],
      ['hotel_key_returned_at', { type: Sequelize.DATE, allowNull: true }],
      ['hotel_key_returned_by', { type: Sequelize.BIGINT.UNSIGNED, allowNull: true }],
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
    const columns = [
      'checkin_token', 'attendance_status', 'checked_in_at', 'checked_in_by',
      'checked_out_at', 'checked_out_by', 'hotel_key_given', 'hotel_key_given_at',
      'hotel_key_given_by', 'hotel_key_returned', 'hotel_key_returned_at',
      'hotel_key_returned_by',
    ];
    for (const column of columns) {
      await queryInterface.removeColumn('registrations', column).catch(() => {});
    }
  },
};