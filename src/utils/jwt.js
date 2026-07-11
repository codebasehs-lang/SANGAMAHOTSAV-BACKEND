const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * JWT helpers. Sign/verify access tokens for admin sessions.
 */
module.exports = {
  sign: (payload) =>
    jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn }),

  verify: (token) => jwt.verify(token, env.jwt.secret),
};
