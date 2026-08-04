const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const env = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const whatsappWebhookRoutes = require('./routes/whatsappWebhook.routes');

/**
 * Builds and configures the Express application.
 * Kept separate from server.js so it can be imported in tests
 * without binding to a port.
 */
function createApp() {
  const app = express();

  const rawBodySaver = (req, res, buf) => {
    if (buf && buf.length > 0) {
      req.rawBody = buf.toString('utf8');
    }
  };

  // Security & parsing
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins || '*',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb', verify: rawBodySaver }));
  app.use(express.urlencoded({ extended: true }));

  // Observability
  app.use(requestLogger);

  // Serve uploaded payment screenshots
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Meta WhatsApp webhook (verification + events)
  app.use('/webhooks/whatsapp', whatsappWebhookRoutes);
  app.use(`${env.apiPrefix}/webhooks/whatsapp`, whatsappWebhookRoutes);

  // Routes
  app.use(env.apiPrefix, apiRoutes);

  // 404 + global error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
