const { Router } = require('express');
const sevaController = require('../controllers/seva.controller');
const { authGuard, requireAdmin } = require('../middleware/auth');

const router = Router();

router.use(authGuard, requireAdmin);
router.get('/summary', sevaController.getSummary);
router.get('/export', sevaController.exportExcel);

module.exports = router;
