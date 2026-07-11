const feedbackRepository = require('../repositories/feedback.repository');
const excelService = require('./excel.service');
const ApiError = require('../utils/ApiError');
const { getPagination, buildMeta } = require('../utils/pagination');

/**
 * Business logic for feedback (public submit + admin review).
 */
class FeedbackService {
  create(payload) {
    return feedbackRepository.create({
      name: payload.name,
      mobileNumber: payload.mobileNumber,
      overallRating: payload.overallRating,
      suggestions: payload.suggestions || null,
    });
  }

  async list(query) {
    const { page, limit, offset } = getPagination(query);
    const where = feedbackRepository.buildWhere({
      search: query.search?.trim(),
      rating: query.rating,
    });

    const { rows, count } = await feedbackRepository.findAndCountAll({
      limit,
      offset,
      where,
      order: [['created_at', 'DESC']],
    });
    return { data: rows, meta: buildMeta({ count, page, limit }) };
  }

  async getById(id) {
    const feedback = await feedbackRepository.findById(id);
    if (!feedback) throw ApiError.notFound('Feedback not found.');
    return feedback;
  }

  async exportToExcel(query) {
    const where = feedbackRepository.buildWhere({
      search: query.search?.trim(),
      rating: query.rating,
    });
    const rows = await feedbackRepository.findAllForExport({
      where,
      order: [['created_at', 'DESC']],
    });
    return excelService.buildFeedbackWorkbook(rows);
  }
}

module.exports = new FeedbackService();
