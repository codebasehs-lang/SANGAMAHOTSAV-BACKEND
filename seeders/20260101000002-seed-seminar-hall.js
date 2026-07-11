'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('seminar_halls', [
      {
        hall_name: 'Sangamahotsav Main Seminar Hall',
        hall_address: 'ISKCON Campus, Main Road, Bhubaneswar, Odisha 751002',
        hall_map_link: 'https://maps.google.com/?q=ISKCON+Bhubaneswar',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('seminar_halls', {
      hall_name: { [Sequelize.Op.eq]: 'Sangamahotsav Main Seminar Hall' },
    });
  },
};
