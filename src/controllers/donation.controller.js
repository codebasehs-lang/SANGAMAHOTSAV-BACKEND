const donationService = require('../services/donation.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messages = require('../constants/messages');
const ExcelJS = require('exceljs');

/**
 * Donation Controller - HTTP layer for donation management
 */
class DonationController {
  /**
   * List all donations with filters and pagination
   */
  list = asyncHandler(async (req, res) => {
    const { data, meta } = await donationService.listDonations(req.query);
    return ApiResponse.send(res, {
      data,
      meta,
      message: messages.FETCHED,
    });
  });

  /**
   * Get unique donation labels for filtering
   */
  getLabels = asyncHandler(async (req, res) => {
    const labels = await donationService.getDonationLabels();
    return ApiResponse.send(res, {
      data: labels,
      message: messages.FETCHED,
    });
  });

  /**
   * Get donation statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await donationService.getDonationStats();
    return ApiResponse.send(res, {
      data: stats,
      message: messages.FETCHED,
    });
  });

  /**
   * Export donations as Excel (.xlsx)
   */
  export = asyncHandler(async (req, res) => {
    const donations = await donationService.exportDonations(req.query);

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Donations');

    // Add header row
    worksheet.columns = [
      { header: 'Devotee Name', key: 'devoteeName', width: 20 },
      { header: 'Mobile Number', key: 'mobileNumber', width: 15 },
      { header: 'Category', key: 'devoteeCategory', width: 15 },
      { header: 'Seva ID', key: 'sevaId', width: 25 },
      { header: 'Seva Label', key: 'sevaLabel', width: 30 },
      { header: 'Amount (₹)', key: 'amount', width: 12 },
      { header: 'Donated At', key: 'donatedAt', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' },
    };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center' };

    // Add data rows
    donations.forEach((donation) => {
      worksheet.addRow({
        devoteeName: donation.devoteeName,
        mobileNumber: donation.mobileNumber,
        devoteeCategory: donation.devoteeCategory,
        sevaId: donation.sevaId,
        sevaLabel: donation.sevaLabel,
        amount: donation.amount,
        donatedAt: new Date(donation.donatedAt).toLocaleDateString('en-IN'),
      });
    });

    // Format amount column as currency
    worksheet.getColumn('amount').numFmt = '₹#,##0.00';

    // Center align numeric columns
    worksheet.getColumn('amount').alignment = { horizontal: 'right' };
    worksheet.getColumn('devoteeCategory').alignment = { horizontal: 'center' };

    // Add summary at the bottom
    const lastRow = worksheet.lastRow.number + 2;
    worksheet.getCell(`A${lastRow}`).value = 'Total Donations:';
    worksheet.getCell(`A${lastRow}`).font = { bold: true };
    worksheet.getCell(`F${lastRow}`).value = donations.reduce((sum, d) => sum + d.amount, 0);
    worksheet.getCell(`F${lastRow}`).font = { bold: true };
    worksheet.getCell(`F${lastRow}`).numFmt = '₹#,##0.00';

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="donations_${new Date().toISOString().split('T')[0]}.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  });
}

module.exports = new DonationController();
