const { Registration } = require('../models');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');
const { getPagination, buildMeta } = require('../utils/pagination');

/**
 * Donation Service - Handles donation data retrieval and filtering
 */
class DonationService {
  /**
   * Get all donations with filters and pagination
   * @param {Object} query - Query parameters
   * @param {string} query.page - Page number
   * @param {string} query.limit - Records per page
   * @param {string} query.search - Search by devotee name
   * @param {string} query.donationLabel - Filter by donation label/seva
   * @returns {Object} Paginated donations data
   */
  async listDonations(query) {
    const { page, limit, offset } = getPagination(query);
    const where = {};
    const filters = {};

    // Search by devotee name
    if (query.search && query.search.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${query.search}%` } },
        { initiatedName: { [Op.like]: `%${query.search}%` } },
      ];
    }

    // Fetch all registrations with donations (no pagination at DB level due to nested arrays)
    const donations = await Registration.findAll({
      where: {
        donationItems: { [Op.ne]: null },
        ...where,
      },
      attributes: [
        'id',
        'name',
        'initiatedName',
        'mobileNumber',
        'devoteeCategory',
        'donationItems',
        'createdAt',
      ],
      order: [['createdAt', 'DESC']],
      raw: false,
      subQuery: false,
    });

    // Process and flatten donations
    const processedDonations = [];

    donations.forEach((registration) => {
      if (Array.isArray(registration.donationItems) && registration.donationItems.length > 0) {
        registration.donationItems.forEach((donation) => {
          // Apply donation label/sevaId filter
          if (query.donationLabel && query.donationLabel.trim()) {
            if (donation.id !== query.donationLabel) return;
          }

          processedDonations.push({
            donationId: `${registration.id}-${donation.id}`,
            registrationId: registration.id,
            devoteeName: registration.initiatedName || registration.name,
            mobileNumber: registration.mobileNumber,
            devoteeCategory: registration.devoteeCategory,
            sevaLabel: donation.label,
            sevaId: donation.id,
            amount: donation.amount,
            donatedAt: registration.createdAt,
          });
        });
      }
    });

    // Apply pagination on flattened results
    const paginatedDonations = processedDonations.slice(offset, offset + limit);

    return {
      data: paginatedDonations,
      meta: buildMeta({
        count: processedDonations.length,
        page,
        limit,
      }),
    };
  }

  /**
   * Get unique donation labels/sevas for filtering
   * @returns {Array} List of donation sevaIds
   */
  async getDonationLabels() {
    const registrations = await Registration.findAll({
      where: {
        donationItems: { [Op.ne]: null },
      },
      attributes: ['donationItems'],
      raw: true,
    });

    const sevaIds = new Set();

    registrations.forEach((reg) => {
      if (Array.isArray(reg.donationItems)) {
        reg.donationItems.forEach((donation) => {
          if (donation.id) {
            sevaIds.add(donation.id);
          }
        });
      }
    });

    return Array.from(sevaIds).sort();
  }

  /**
   * Get donation statistics
   * @returns {Object} Statistics data
   */
  async getDonationStats() {
    const registrations = await Registration.findAll({
      where: {
        donationItems: { [Op.ne]: null },
      },
      attributes: ['donationItems'],
      raw: true,
    });

    const stats = {
      totalDonations: 0,
      totalAmount: 0,
      uniqueDonors: new Set(),
      byLabel: {},
    };

    registrations.forEach((reg) => {
      stats.uniqueDonors.add(reg.id);

      if (Array.isArray(reg.donationItems)) {
        reg.donationItems.forEach((donation) => {
          stats.totalDonations += 1;
          stats.totalAmount += donation.amount || 0;

          if (!stats.byLabel[donation.id]) {
            stats.byLabel[donation.id] = {
              count: 0,
              totalAmount: 0,
            };
          }
          stats.byLabel[donation.id].count += 1;
          stats.byLabel[donation.id].totalAmount += donation.amount || 0;
        });
      }
    });

    return {
      totalDonations: stats.totalDonations,
      totalAmount: stats.totalAmount,
      uniqueDonors: stats.uniqueDonors.size,
      byLabel: stats.byLabel,
    };
  }

  /**
   * Export donations data
   * @param {Object} filters - Filters to apply
   * @returns {Array} Flat array of donations
   */
  async exportDonations(filters = {}) {
    const where = {};

    if (filters.search && filters.search.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { initiatedName: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const registrations = await Registration.findAll({
      where: {
        donationItems: { [Op.ne]: null },
        ...where,
      },
      attributes: [
        'id',
        'name',
        'initiatedName',
        'mobileNumber',
        'devoteeCategory',
        'donationItems',
        'createdAt',
      ],
      order: [['createdAt', 'DESC']],
      raw: false,
    });

    const donations = [];

    registrations.forEach((registration) => {
      if (Array.isArray(registration.donationItems) && registration.donationItems.length > 0) {
        registration.donationItems.forEach((donation) => {
          if (filters.donationLabel && donation.id !== filters.donationLabel) return;

          donations.push({
            devoteeName: registration.initiatedName || registration.name,
            mobileNumber: registration.mobileNumber,
            devoteeCategory: registration.devoteeCategory,
            sevaId: donation.id,
            sevaLabel: donation.label,
            amount: donation.amount,
            donatedAt: registration.createdAt,
          });
        });
      }
    });

    return donations;
  }
}

module.exports = new DonationService();
