const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { loginRules } = require('../validators/auth.validator');
const { authGuard, requireAdmin } = require('../middleware/auth');

const router = Router();

// Public: admin login
router.post('/login', validate(loginRules), authController.login);

// Protected: current admin profile
router.get('/me', authGuard, requireAdmin, authController.me);

module.exports = router;
