const { Op } = require('sequelize');
const { Feedback } = require('../models');

/**
 * Data-access layer for feedback.
 */
class FeedbackRepository {
  create(data, options = {}) {
    return Feedback.create(data, options);
  }

  findById(id) {
    return Feedback.findByPk(id);
  }

  findAndCountAll({ limit, offset, where, order }) {
    return Feedback.findAndCountAll({ where, limit, offset, order });
  }

  findAllForExport({ where, order }) {
    return Feedback.findAll({ where, order });
  }

  /** Search by name or mobile; optional exact rating filter. */
  buildWhere({ search, rating }) {
    const where = {};
    if (search) {
      const like = { [Op.like]: `%${search}%` };
      where[Op.or] = [{ name: like }, { mobile_number: like }];
    }
    if (rating) where.overall_rating = rating;
    return where;
  }
}

module.exports = new FeedbackRepository();
