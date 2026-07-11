'use strict';

const bcrypt = require('bcrypt');
require('dotenv').config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const name = process.env.SEED_ADMIN_NAME || 'Super Admin';
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@sangamahotsav.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const now = new Date();

    await queryInterface.bulkInsert('admins', [
      {
        name,
        email,
        password_hash: passwordHash,
        role: 'ADMIN',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@sangamahotsav.com';
    await queryInterface.bulkDelete('admins', {
      email: { [Sequelize.Op.eq]: email },
    });
  },
};
