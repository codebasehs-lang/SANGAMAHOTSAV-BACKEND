const { RegistrationSetting } = require('../models');

const DEFAULT_CLOSED_MESSAGE =
  'Registrations are currently closed. Please check back later.';

/**
 * Manages the single row that controls whether the public registration
 * form is open, and the message shown to visitors while it's closed.
 */
class RegistrationSettingService {
  async _ensureSingleton() {
    const [row] = await RegistrationSetting.findOrCreate({
      where: { id: 1 },
      defaults: { id: 1, isOpen: true, closedMessage: DEFAULT_CLOSED_MESSAGE },
    });
    return row;
  }

  async getSetting() {
    return this._ensureSingleton();
  }

  async updateSetting({ isOpen, closedMessage }) {
    const row = await this._ensureSingleton();
    if (typeof isOpen === 'boolean') row.isOpen = isOpen;
    if (typeof closedMessage === 'string') row.closedMessage = closedMessage;
    await row.save();
    return row;
  }
}

module.exports = new RegistrationSettingService();
