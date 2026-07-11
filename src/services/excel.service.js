const ExcelJS = require('exceljs');

/**
 * Generates an .xlsx workbook buffer from registration rows.
 * Kept as a dedicated service so export formatting is reusable
 * and decoupled from controllers.
 */
class ExcelService {
  async buildRegistrationsWorkbook(registrations) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SANGAMAHOTSAV';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Registrations');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Age', key: 'age', width: 6 },
      { header: 'Initiated Name', key: 'initiatedName', width: 22 },
      { header: 'Category', key: 'devoteeCategory', width: 14 },
      { header: 'Mobile', key: 'mobileNumber', width: 15 },
      { header: 'Coming From', key: 'comingFrom', width: 18 },
      { header: 'Arrival Date', key: 'arrivalDate', width: 14 },
      { header: 'Arrival Time', key: 'arrivalTime', width: 12 },
      { header: 'Departure Date', key: 'departureDate', width: 14 },
      { header: 'Departure Time', key: 'departureTime', width: 12 },
      { header: 'Shared Accom.', key: 'sharedAccommodation', width: 16 },
      { header: 'Family Accom.', key: 'familyAccommodation', width: 16 },
      { header: 'Journey Prasad', key: 'needJourneyPrasad', width: 14 },
      { header: 'Preferred Subject', key: 'preferredSubject', width: 22 },
      { header: 'Services', key: 'services', width: 30 },
      { header: 'Own 4-Wheeler', key: 'ownFourWheeler', width: 14 },
      { header: 'Amount Paid', key: 'amountPaid', width: 12 },
      { header: 'Accom. Status', key: 'accommodationStatus', width: 14 },
      { header: 'Hotel', key: 'hotelName', width: 20 },
      { header: 'Room', key: 'roomNumber', width: 10 },
      { header: 'Comments', key: 'comments', width: 30 },
      { header: 'Registered At', key: 'createdAt', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle' };

    registrations.forEach((r) => {
      const plain = typeof r.get === 'function' ? r.get({ plain: true }) : r;
      sheet.addRow({
        ...plain,
        needJourneyPrasad: plain.needJourneyPrasad ? 'Yes' : 'No',
        ownFourWheeler: plain.ownFourWheeler ? 'Yes' : 'No',
        services: Array.isArray(plain.services)
          ? plain.services.join(', ')
          : '',
        hotelName: plain.assignment?.hotelName || '',
        roomNumber: plain.assignment?.roomNumber || '',
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  async buildFeedbackWorkbook(feedbacks) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SANGAMAHOTSAV';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Feedback');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Mobile', key: 'mobileNumber', width: 15 },
      { header: 'Rating', key: 'overallRating', width: 10 },
      { header: 'Suggestions', key: 'suggestions', width: 50 },
      { header: 'Submitted At', key: 'createdAt', width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };

    feedbacks.forEach((f) => {
      const plain = typeof f.get === 'function' ? f.get({ plain: true }) : f;
      sheet.addRow(plain);
    });

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = new ExcelService();
