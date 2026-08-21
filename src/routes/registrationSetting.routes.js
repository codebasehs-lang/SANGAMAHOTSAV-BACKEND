const { Router } = require('express');
const registrationSettingController = require('../controllers/registrationSetting.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin, requireEditor } = require('../middleware/auth');
const { updateRules } = require('../validators/registrationSetting.validator');

const router = Router();

// Public: consumed by the registration page to know if it should render the form.
router.get('/public', registrationSettingController.getPublic);

router.use(authGuard, requireAdmin);

router.get('/', registrationSettingController.get);
router.put('/', requireEditor, validate(updateRules), registrationSettingController.update);

module.exports = router;
