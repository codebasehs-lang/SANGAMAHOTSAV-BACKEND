const { Router } = require('express');
const registrantAuthController = require('../controllers/registrantAuth.controller');
const { authGuard } = require('../middleware/auth');

const router = Router();

router.post('/login', registrantAuthController.login);
router.get('/me', authGuard, registrantAuthController.me);
router.put('/change-password', authGuard, registrantAuthController.changePassword);

module.exports = router;
