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

  whatsapp: {
    graphBaseUrl: process.env.WHATSAPP_GRAPH_BASE_URL || 'https://graph.facebook.com',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v23.0',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
    languageCode: process.env.WHATSAPP_LANGUAGE_CODE || 'en',
    defaultTemplateName: process.env.WHATSAPP_DEFAULT_TEMPLATE_NAME || '',
    paymentTemplateName: process.env.WHATSAPP_PAYMENT_TEMPLATE_NAME || '',
  },
};

module.exports = env;
