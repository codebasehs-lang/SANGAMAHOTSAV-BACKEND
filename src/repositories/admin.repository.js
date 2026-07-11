const { Admin } = require('../models');

/**
 * Data-access layer for the Admin entity. Isolates Sequelize from
 * the service layer so business logic never touches the ORM directly.
 */
class AdminRepository {
  /** Fetch an admin by email, including the password hash for auth. */
  findByEmailWithPassword(email) {
    return Admin.scope('withPassword').findOne({ where: { email } });
  }

  findById(id) {
    return Admin.findByPk(id);
  }

  updateLastLogin(id, date = new Date()) {
    return Admin.update({ lastLoginAt: date }, { where: { id } });
  }
}

module.exports = new AdminRepository();
