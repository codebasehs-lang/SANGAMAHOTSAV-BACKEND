'use strict';

/**
 * Enforce unique mobile numbers on registrations.
 * Drops the previous non-unique index and adds a unique one.
 */
module.exports = {
  async up(queryInterface) {
    // Remove the old non-unique index if present.
    try {
      await queryInterface.removeIndex('registrations', 'idx_reg_mobile');
    } catch {
      /* index may not exist; ignore */
    }

    await queryInterface.addIndex('registrations', ['mobile_number'], {
      name: 'uk_reg_mobile',
      unique: true,
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('registrations', 'uk_reg_mobile');
    } catch {
      /* ignore */
    }
    await queryInterface.addIndex('registrations', ['mobile_number'], {
      name: 'idx_reg_mobile',
    });
  },
};
