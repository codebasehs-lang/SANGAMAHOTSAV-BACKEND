-- =====================================================================
-- SANGAMAHOTSAV.COM — MySQL 8 Schema (Phase 3)
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- This raw DDL mirrors the Sequelize migrations for reference / manual setup.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `sangamahotsav`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `sangamahotsav`;

-- ---------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------
CREATE TABLE `admins` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(120) NOT NULL,
  `email`         VARCHAR(160) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
  `is_active`     TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- registrations (maps to the 20 form fields)
-- ---------------------------------------------------------------------
CREATE TABLE `registrations` (
  `id`                              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`                            VARCHAR(150) NOT NULL,
  `age`                             INT UNSIGNED NOT NULL,
  `initiated_name`                  VARCHAR(150) NULL,
  `devotee_category`                ENUM('DISCIPLE','NON_DISCIPLE') NOT NULL,
  `family_members`                  JSON NULL,
  `mobile_number`                   VARCHAR(15) NOT NULL,
  `coming_from`                     VARCHAR(150) NOT NULL,
  `arrival_date`                    DATE NULL,
  `arrival_time`                    TIME NULL,
  `non_attending_type`              ENUM('NON_ATTENDING_DISCIPLE','ATTENDING_NOT_STAYING') NULL,
  `shared_accommodation`            ENUM('DORMITORY','NON_AC_SHARING','AC_SHARING') NULL,
  `family_accommodation`            ENUM('DELUXE_AC','PREMIUM_AC') NULL,
  `additional_family_accommodation` ENUM('DELUXE','PREMIUM') NULL,
  `departure_date`                  DATE NULL,
  `departure_time`                  TIME NULL,
  `need_journey_prasad`             TINYINT(1) NOT NULL DEFAULT 0,
  `preferred_subject`               ENUM(
                                      'BHAGAVAD_GITA','SRIMAD_BHAGAVATAM','CHAITANYA_CHARITAMRITA',
                                      'HARINAMA_CHINTAMANI','HOW_TO_STUDY_SB','HOW_TO_STUDY_CC',
                                      'NECTAR_OF_INSTRUCTION','VAISHNAVA_ETIQUETTE','QA_SESSION',
                                      'VAISHNAVA_SONGS','APARADHA','DEALING_WITH_VAISHNAVAS','OTHER'
                                    ) NULL,
  `preferred_subject_other`         VARCHAR(200) NULL,
  `services`                        JSON NULL,
  `own_four_wheeler`                TINYINT(1) NOT NULL DEFAULT 0,
  `amount_paid`                     DECIMAL(10,2) NULL DEFAULT 0.00,
  `comments`                        TEXT NULL,
  `accommodation_status`            ENUM('PENDING','ASSIGNED','NOT_REQUIRED') NOT NULL DEFAULT 'PENDING',
  `created_at`                      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reg_mobile` (`mobile_number`),
  KEY `idx_reg_status` (`accommodation_status`),
  KEY `idx_reg_created` (`created_at`),
  FULLTEXT KEY `ft_reg_search` (`name`, `coming_from`),
  CONSTRAINT `chk_reg_age` CHECK (`age` BETWEEN 0 AND 120),
  CONSTRAINT `chk_reg_amount` CHECK (`amount_paid` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- seminar_halls (single active hall enforced via generated column)
-- ---------------------------------------------------------------------
CREATE TABLE `seminar_halls` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `hall_name`    VARCHAR(150) NOT NULL,
  `hall_address` VARCHAR(255) NOT NULL,
  `hall_map_link` VARCHAR(500) NULL,
  `is_active`    TINYINT(1) NOT NULL DEFAULT 0,
  `active_flag`  TINYINT(1) GENERATED ALWAYS AS (IF(`is_active` = 1, 1, NULL)) STORED,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_hall_active` (`active_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- accommodation_assignments
-- ---------------------------------------------------------------------
CREATE TABLE `accommodation_assignments` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `registration_id` BIGINT UNSIGNED NOT NULL,
  `hotel_name`      VARCHAR(150) NOT NULL,
  `hotel_address`   VARCHAR(255) NOT NULL,
  `room_number`     VARCHAR(30) NOT NULL,
  `hotel_map_link`  VARCHAR(500) NULL,
  `status`          ENUM('PENDING','ASSIGNED') NOT NULL DEFAULT 'ASSIGNED',
  `assigned_by`     BIGINT UNSIGNED NULL,
  `assigned_at`     DATETIME NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_acc_registration` (`registration_id`),
  KEY `idx_acc_status` (`status`),
  CONSTRAINT `fk_acc_registration` FOREIGN KEY (`registration_id`)
    REFERENCES `registrations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_acc_admin` FOREIGN KEY (`assigned_by`)
    REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- sms_campaigns
-- ---------------------------------------------------------------------
CREATE TABLE `sms_campaigns` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type`             ENUM('ACCOMMODATION','REMINDER_7_DAY','REMINDER_2_DAY') NOT NULL,
  `message_template` TEXT NOT NULL,
  `seminar_hall_id`  BIGINT UNSIGNED NULL,
  `total_recipients` INT UNSIGNED NOT NULL DEFAULT 0,
  `sent_count`       INT UNSIGNED NOT NULL DEFAULT 0,
  `failed_count`     INT UNSIGNED NOT NULL DEFAULT 0,
  `status`           ENUM('PENDING','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
  `triggered_by`     BIGINT UNSIGNED NOT NULL,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_camp_type` (`type`),
  KEY `idx_camp_created` (`created_at`),
  CONSTRAINT `fk_camp_admin` FOREIGN KEY (`triggered_by`)
    REFERENCES `admins` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_camp_hall` FOREIGN KEY (`seminar_hall_id`)
    REFERENCES `seminar_halls` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- sms_logs (append-only)
-- ---------------------------------------------------------------------
CREATE TABLE `sms_logs` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id`         BIGINT UNSIGNED NOT NULL,
  `registration_id`     BIGINT UNSIGNED NULL,
  `mobile_number`       VARCHAR(15) NOT NULL,
  `rendered_message`    TEXT NOT NULL,
  `status`              ENUM('SENT','FAILED') NOT NULL,
  `provider_message_id` VARCHAR(100) NULL,
  `error_message`       TEXT NULL,
  `sent_at`             DATETIME NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_log_campaign` (`campaign_id`),
  KEY `idx_log_status` (`status`),
  KEY `idx_log_mobile` (`mobile_number`),
  CONSTRAINT `fk_log_campaign` FOREIGN KEY (`campaign_id`)
    REFERENCES `sms_campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_log_registration` FOREIGN KEY (`registration_id`)
    REFERENCES `registrations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- feedbacks (append-only, public)
-- ---------------------------------------------------------------------
CREATE TABLE `feedbacks` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(150) NOT NULL,
  `mobile_number`  VARCHAR(15) NOT NULL,
  `overall_rating` TINYINT UNSIGNED NOT NULL,
  `suggestions`    TEXT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fb_mobile` (`mobile_number`),
  KEY `idx_fb_created` (`created_at`),
  CONSTRAINT `chk_fb_rating` CHECK (`overall_rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
