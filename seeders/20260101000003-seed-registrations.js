'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('registrations', [
      {
        name: 'Radha Krishna Das',
        age: 34,
        initiated_name: 'Radha Krishna Das',
        devotee_category: 'DISCIPLE',
        family_members: JSON.stringify([
          { name: 'Sita Devi Dasi', age: 30 },
          { name: 'Gopal', age: 6 },
        ]),
        mobile_number: '9876543210',
        coming_from: 'Kolkata',
        arrival_date: '2026-08-10',
        arrival_time: '10:30:00',
        non_attending_type: null,
        shared_accommodation: null,
        family_accommodation: 'DELUXE_AC',
        additional_family_accommodation: null,
        departure_date: '2026-08-14',
        departure_time: '18:00:00',
        need_journey_prasad: true,
        preferred_subject: 'SRIMAD_BHAGAVATAM',
        preferred_subject_other: null,
        services: JSON.stringify(['KIRTAN', 'PRASADAM_SERVING']),
        own_four_wheeler: true,
        amount_paid: 5000.0,
        comments: 'Requesting ground floor room if possible.',
        accommodation_status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Arjun Sharma',
        age: 27,
        initiated_name: null,
        devotee_category: 'NON_DISCIPLE',
        family_members: null,
        mobile_number: '9812345678',
        coming_from: 'Delhi',
        arrival_date: '2026-08-11',
        arrival_time: '08:00:00',
        non_attending_type: null,
        shared_accommodation: 'AC_SHARING',
        family_accommodation: null,
        additional_family_accommodation: null,
        departure_date: '2026-08-13',
        departure_time: '20:00:00',
        need_journey_prasad: false,
        preferred_subject: 'BHAGAVAD_GITA',
        preferred_subject_other: null,
        services: JSON.stringify(['BOOK_STALL']),
        own_four_wheeler: false,
        amount_paid: 2500.0,
        comments: null,
        accommodation_status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('registrations', {
      mobile_number: { [Sequelize.Op.in]: ['9876543210', '9812345678'] },
    });
  },
};
