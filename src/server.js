const createApp = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { sequelize } = require('./models');

/**
 * Application entry point. Verifies the DB connection,
 * starts the HTTP server, and wires graceful shutdown.
 */
async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    const app = createApp();
    const server = app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`, {
        env: env.nodeEnv,
        apiPrefix: env.apiPrefix,
      });
    });

    const shutdown = (signal) => {
      logger.warn(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await sequelize.close();
        logger.info('Server and DB connections closed');
        process.exit(0);
      });
      // Force-exit if not closed within 10s
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

start();
