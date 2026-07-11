const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authGuard, requireAdmin } = require('../middleware/auth');

const router = Router();

router.use(authGuard, requireAdmin);
router.get('/summary', dashboardController.summary);

module.exports = router;
