const sevaRepository = require('../repositories/seva.repository');
const ExcelJS = require('exceljs');

const GENDER_LABEL = { MALE: 'Prabhuji', FEMALE: 'Mataji' };

class SevaService {
  /**
   * Returns two views of the same data:
   *  - byDevotion: each registrant → their chosen sevas
   *  - bySeva: each seva → list of devotees who chose it
   */
  async getSummary() {
    const rows = await sevaRepository.findAllWithServices();

    const bySeva = {};
    const byDevotion = [];

    for (const row of rows) {
      const services = Array.isArray(row.services) ? row.services : [];
      if (!services.length) continue;

      byDevotion.push({
        id: row.id,
        name: row.name,
        mobileNumber: row.mobileNumber,
        gender: row.gender,
        devoteeCategory: row.devoteeCategory,
        comingFrom: row.comingFrom,
        services,
      });

      for (const svc of services) {
        if (!bySeva[svc]) bySeva[svc] = [];
        bySeva[svc].push({
          id: row.id,
          name: row.name,
          mobileNumber: row.mobileNumber,
          gender: row.gender,
        });
      }
    }

    return { bySeva, byDevotion, totalWithSeva: byDevotion.length };
  }

  async exportToExcel(summary) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SANGAMAHOTSAV';
    workbook.created = new Date();

    // Sheet 1: By Devotee
    const byDevSheet = workbook.addWorksheet('By Devotee');
    byDevSheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Name', key: 'name', width: 26 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Mobile', key: 'mobileNumber', width: 16 },
      { header: 'Category', key: 'devoteeCategory', width: 14 },
      { header: 'Coming From', key: 'comingFrom', width: 20 },
      { header: 'Chosen Sevas', key: 'services', width: 60 },
    ];
    byDevSheet.getRow(1).font = { bold: true };
    for (const d of summary.byDevotion) {
      byDevSheet.addRow({
        ...d,
        gender: GENDER_LABEL[d.gender] ?? d.gender ?? '',
        services: d.services.join(', '),
      });
    }

    // Sheet 2: By Seva
    const bySevaSheet = workbook.addWorksheet('By Seva');
    bySevaSheet.columns = [
      { header: 'Seva', key: 'seva', width: 36 },
      { header: 'Volunteer Name', key: 'name', width: 26 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Mobile', key: 'mobileNumber', width: 16 },
    ];
    bySevaSheet.getRow(1).font = { bold: true };
    for (const [seva, devotees] of Object.entries(summary.bySeva).sort((a, b) => a[0].localeCompare(b[0]))) {
      for (const d of devotees) {
        bySevaSheet.addRow({
          seva,
          name: d.name,
          gender: GENDER_LABEL[d.gender] ?? d.gender ?? '',
          mobileNumber: d.mobileNumber,
        });
      }
    }

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = new SevaService();
