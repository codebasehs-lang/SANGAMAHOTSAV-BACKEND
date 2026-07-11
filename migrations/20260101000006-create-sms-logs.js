'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sms_logs', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      campaign_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'sms_campaigns', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      registration_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'registrations', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      mobile_number: { type: Sequelize.STRING(15), allowNull: false },
      rendered_message: { type: Sequelize.TEXT, allowNull: false },
      status: {
        type: Sequelize.ENUM('SENT', 'FAILED'),
        allowNull: false,
      },
      provider_message_id: { type: Sequelize.STRING(100), allowNull: true },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('sms_logs', ['campaign_id'], {
      name: 'idx_log_campaign',
    });
    await queryInterface.addIndex('sms_logs', ['status'], {
      name: 'idx_log_status',
    });
    await queryInterface.addIndex('sms_logs', ['mobile_number'], {
      name: 'idx_log_mobile',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sms_logs');
  },
};
