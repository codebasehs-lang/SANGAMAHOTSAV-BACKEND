const bcrypt = require('bcrypt');
const env = require('../config/env');

/**
 * Password hashing utilities. Centralizes bcrypt so the cost factor
 * and algorithm are defined in exactly one place.
 */
module.exports = {
  hash: (plain) => bcrypt.hash(plain, env.bcryptSaltRounds),
  compare: (plain, hash) => bcrypt.compare(plain, hash),
};
