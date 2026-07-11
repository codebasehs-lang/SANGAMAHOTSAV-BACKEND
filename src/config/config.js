require('dotenv').config();

/**
 * Sequelize CLI configuration (migrations & seeders).
 * Kept separate from the runtime app config so sequelize-cli can read it directly.
 */
const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sangamahotsav',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  define: {
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  dialectOptions: {
    charset: 'utf8mb4',
  },
  logging: false,
};

module.exports = {
  development: { ...common },
  test: { ...common, database: `${common.database}_test` },
  production: { ...common },
};
