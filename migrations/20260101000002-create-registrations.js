'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registrations', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      age: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      initiated_name: { type: Sequelize.STRING(150), allowNull: true },
      devotee_category: {
        type: Sequelize.ENUM('DISCIPLE', 'NON_DISCIPLE'),
        allowNull: false,
      },
      family_members: { type: Sequelize.JSON, allowNull: true },
      mobile_number: { type: Sequelize.STRING(15), allowNull: false },
      coming_from: { type: Sequelize.STRING(150), allowNull: false },
      arrival_date: { type: Sequelize.DATEONLY, allowNull: true },
      arrival_time: { type: Sequelize.TIME, allowNull: true },
      non_attending_type: {
        type: Sequelize.ENUM(
          'NON_ATTENDING_DISCIPLE',
          'ATTENDING_NOT_STAYING'
        ),
        allowNull: true,
      },
      shared_accommodation: {
        type: Sequelize.ENUM('DORMITORY', 'NON_AC_SHARING', 'AC_SHARING'),
        allowNull: true,
      },
      family_accommodation: {
        type: Sequelize.ENUM('DELUXE_AC', 'PREMIUM_AC'),
        allowNull: true,
      },
      additional_family_accommodation: {
        type: Sequelize.ENUM('DELUXE', 'PREMIUM'),
        allowNull: true,
      },
      departure_date: { type: Sequelize.DATEONLY, allowNull: true },
      departure_time: { type: Sequelize.TIME, allowNull: true },
      need_journey_prasad: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      preferred_subject: {
        type: Sequelize.ENUM(
          'BHAGAVAD_GITA',
          'SRIMAD_BHAGAVATAM',
          'CHAITANYA_CHARITAMRITA',
          'HARINAMA_CHINTAMANI',
          'HOW_TO_STUDY_SB',
          'HOW_TO_STUDY_CC',
          'NECTAR_OF_INSTRUCTION',
          'VAISHNAVA_ETIQUETTE',
          'QA_SESSION',
          'VAISHNAVA_SONGS',
          'APARADHA',
          'DEALING_WITH_VAISHNAVAS',
          'OTHER'
        ),
        allowNull: true,
      },
      preferred_subject_other: { type: Sequelize.STRING(200), allowNull: true },
      services: { type: Sequelize.JSON, allowNull: true },
      own_four_wheeler: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      amount_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      comments: { type: Sequelize.TEXT, allowNull: true },
      accommodation_status: {
        type: Sequelize.ENUM('PENDING', 'ASSIGNED', 'NOT_REQUIRED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('registrations', ['mobile_number'], {
      name: 'idx_reg_mobile',
    });
    await queryInterface.addIndex('registrations', ['accommodation_status'], {
      name: 'idx_reg_status',
    });
    await queryInterface.addIndex('registrations', ['created_at'], {
      name: 'idx_reg_created',
    });
    await queryInterface.addIndex('registrations', ['name', 'coming_from'], {
      name: 'ft_reg_search',
      type: 'FULLTEXT',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('registrations');
  },
};
