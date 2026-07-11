const env = require('../config/env');

/**
 * Lightweight structured logger (no external dependency).
 * Emits single-line JSON in production for log aggregation,
 * and readable colored output in development.
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = env.nodeEnv === 'production' ? LEVELS.info : LEVELS.debug;

const COLORS = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
};

function write(level, message, meta) {
  if (LEVELS[level] > currentLevel) return;

  const timestamp = new Date().toISOString();

  if (env.nodeEnv === 'production') {
    const entry = { timestamp, level, message, ...(meta ? { meta } : {}) };
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
    return;
  }

  const color = COLORS[level] || COLORS.reset;
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](
    `${color}[${timestamp}] ${level.toUpperCase()}${COLORS.reset}: ${message}${metaStr}`
  );
}

module.exports = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
};
