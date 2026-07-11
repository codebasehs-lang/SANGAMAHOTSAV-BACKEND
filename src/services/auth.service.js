const adminRepository = require('../repositories/admin.repository');
const password = require('../utils/password');
const jwt = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');

/**
 * Authentication business logic. Verifies credentials, enforces
 * account status, and issues JWT access tokens.
 */
class AuthService {
  async login({ email, password: plainPassword }) {
    const admin = await adminRepository.findByEmailWithPassword(email);

    // Uniform error for missing user vs wrong password (no user enumeration).
    if (!admin) {
      throw ApiError.unauthorized(messages.INVALID_CREDENTIALS);
    }

    if (!admin.isActive) {
      throw ApiError.forbidden(messages.ACCOUNT_INACTIVE);
    }

    const isMatch = await password.compare(plainPassword, admin.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized(messages.INVALID_CREDENTIALS);
    }

    await adminRepository.updateLastLogin(admin.id);

    const token = jwt.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  /** Returns the current admin profile (used by GET /auth/me). */
  async getProfile(adminId) {
    const admin = await adminRepository.findById(adminId);
    if (!admin) throw ApiError.notFound(messages.NOT_FOUND);
    return admin;
  }
}

module.exports = new AuthService();
