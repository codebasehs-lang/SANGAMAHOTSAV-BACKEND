const { Router } = require('express');
const registrationController = require('../controllers/registration.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin } = require('../middleware/auth');
const {
  createRegistrationRules,
  updateRegistrationRules,
  idParamRule,
  listQueryRules,
} = require('../validators/registration.validator');

const router = Router();

// Public: devotee submits registration
router.post('/', validate(createRegistrationRules), registrationController.create);

// Everything below requires an authenticated admin
router.use(authGuard, requireAdmin);

router.get('/export', registrationController.export);
router.get('/', validate(listQueryRules), registrationController.list);
router.get('/:id', validate(idParamRule), registrationController.getById);
router.put('/:id', validate(updateRegistrationRules), registrationController.update);
router.delete('/:id', validate(idParamRule), registrationController.remove);

module.exports = router;
