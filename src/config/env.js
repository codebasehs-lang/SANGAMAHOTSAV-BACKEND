require('dotenv').config();

/**
 * Centralized, validated environment configuration.
 * Single source of truth for all runtime settings.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : '*',

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'sangamahotsav',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'insecure_dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || 'Super Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@sangamahotsav.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  },

  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || '',
    senderId: process.env.MSG91_SENDER_ID || '',
    templateId: process.env.MSG91_TEMPLATE_ID || '',
    route: process.env.MSG91_ROUTE || '4',
  },
};

module.exports = env;
