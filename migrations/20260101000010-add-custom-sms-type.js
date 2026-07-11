'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `sms_campaigns` MODIFY COLUMN `type` " +
        "ENUM('ACCOMMODATION','REMINDER_7_DAY','REMINDER_2_DAY','CUSTOM') NOT NULL"
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `sms_campaigns` MODIFY COLUMN `type` " +
        "ENUM('ACCOMMODATION','REMINDER_7_DAY','REMINDER_2_DAY') NOT NULL"
    );
  },
};
