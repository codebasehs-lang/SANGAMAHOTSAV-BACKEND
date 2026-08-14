const { Registration } = require('../models');
const { Op } = require('sequelize');

class SevaRepository {
  /** Returns all registrations that have at least one seva selected. */
  async findAllWithServices() {
    return Registration.findAll({
      attributes: ['id', 'name', 'mobileNumber', 'gender', 'devoteeCategory', 'services', 'comingFrom'],
      where: {
        services: { [Op.ne]: null },
      },
      order: [['name', 'ASC']],
      raw: true,
    });
  }
}

module.exports = new SevaRepository();
