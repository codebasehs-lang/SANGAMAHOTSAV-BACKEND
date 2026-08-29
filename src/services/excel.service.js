const ExcelJS = require('exceljs');

const GENDER_LABEL = { MALE: 'Prabhuji', FEMALE: 'Mataji' };
const genderLabel = (g) => GENDER_LABEL[g] || g || '';

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
      { header: 'Facilitator', key: 'facilitatorName', width: 20 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Family Members', key: 'familyMembers', width: 35 },
      { header: 'Arrival Date', key: 'arrivalDate', width: 14 },
      { header: 'Arrival Time', key: 'arrivalTime', width: 12 },
      { header: 'Departure Date', key: 'departureDate', width: 14 },
      { header: 'Departure Time', key: 'departureTime', width: 12 },
      { header: 'Shared Accom.', key: 'sharedAccommodation', width: 16 },
      { header: 'Family Accom.', key: 'familyAccommodation', width: 16 },
      { header: 'Journey Prasad', key: 'needJourneyPrasad', width: 14 },
      { header: 'Preferred Subject', key: 'preferredSubject', width: 22 },
      { header: 'Services', key: 'services', width: 30 },
      { header: 'Donations', key: 'donations', width: 40 },
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
      const donations = Array.isArray(plain.donationItems)
        ? plain.donationItems
            .map((d) => {
              const id = d.id || '';
              const label = id
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (m) => m.toUpperCase());
              const amount = Number(d.amount || 0).toLocaleString();
              return `${label} – ₹ ${amount}`;
            })
            .join(', ')
        : '';
      sheet.addRow({
        ...plain,
        gender: genderLabel(plain.gender),
        needJourneyPrasad: plain.needJourneyPrasad ? 'Yes' : 'No',
        ownFourWheeler: plain.ownFourWheeler ? 'Yes' : 'No',
        services: Array.isArray(plain.services)
          ? plain.services.join(', ')
          : '',
        donations,
        familyMembers: Array.isArray(plain.familyMembers)
          ? plain.familyMembers
              .filter((m) => m.name)
              .map((m) => `${m.name} (${m.age ?? '?'}${m.gender ? ', ' + genderLabel(m.gender) : ''})`)
              .join(', ')
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

  async buildChildrenWorkbook(children) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SANGAMAHOTSAV';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Children Gifts List');
    sheet.columns = [
      { header: 'S.No', key: 'sNo', width: 8 },
      { header: 'Child Name', key: 'childName', width: 26 },
      { header: 'Age', key: 'age', width: 8 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Type', key: 'relationship', width: 18 },
      { header: 'Parent / Main Devotee', key: 'parentName', width: 26 },
      { header: 'Contact Mobile', key: 'mobileNumber', width: 16 },
      { header: 'Coming From', key: 'comingFrom', width: 20 },
      { header: 'Attendance Status', key: 'attendanceStatus', width: 18 },
      { header: 'Gift Given', key: 'giftGivenText', width: 14 },
      { header: 'Registration ID', key: 'registrationId', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle' };

    children.forEach((c, idx) => {
      sheet.addRow({
        sNo: idx + 1,
        childName: c.childName,
        age: c.age,
        gender: genderLabel(c.gender),
        relationship: c.relationship,
        parentName: c.parentName,
        mobileNumber: c.mobileNumber,
        comingFrom: c.comingFrom || '',
        attendanceStatus: c.attendanceStatus || 'NOT_ARRIVED',
        giftGivenText: c.giftGiven ? 'Yes' : 'No',
        registrationId: c.registrationId,
      });
    });

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = new ExcelService();
