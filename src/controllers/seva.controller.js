const sevaService = require('../services/seva.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

class SevaController {
  getSummary = asyncHandler(async (req, res) => {
    const data = await sevaService.getSummary();
    return ApiResponse.send(res, { data, message: 'Seva summary fetched.' });
  });

  exportExcel = asyncHandler(async (req, res) => {
    const summary = await sevaService.getSummary();
    const buffer = await sevaService.exportToExcel(summary);
    const filename = `seva_assignments_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(Buffer.from(buffer));
  });
}

module.exports = new SevaController();
