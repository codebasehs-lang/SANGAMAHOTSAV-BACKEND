'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sms_campaigns', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: Sequelize.ENUM(
          'ACCOMMODATION',
          'REMINDER_7_DAY',
          'REMINDER_2_DAY'
        ),
        allowNull: false,
      },
      message_template: { type: Sequelize.TEXT, allowNull: false },
      seminar_hall_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'seminar_halls', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      total_recipients: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      sent_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      failed_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      triggered_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
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

    await queryInterface.addIndex('sms_campaigns', ['type'], {
      name: 'idx_camp_type',
    });
    await queryInterface.addIndex('sms_campaigns', ['created_at'], {
      name: 'idx_camp_created',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sms_campaigns');
  },
};
