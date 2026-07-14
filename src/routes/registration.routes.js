const { Router } = require('express');
const registrationController = require('../controllers/registration.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin, requireEditor } = require('../middleware/auth');
const { uploadPaymentScreenshot } = require('../middleware/upload');
const {
  createRegistrationRules,
  updateRegistrationRules,
  idParamRule,
  listQueryRules,
} = require('../validators/registration.validator');

const router = Router();

// Public: devotee submits registration (multipart/form-data to support screenshot upload)
router.post(
  '/',
  uploadPaymentScreenshot,
  validate(createRegistrationRules),
  registrationController.create
);

// Everything below requires an authenticated admin
router.use(authGuard, requireAdmin);

router.get('/export', registrationController.export);
router.get('/', validate(listQueryRules), registrationController.list);
router.get('/:id', validate(idParamRule), registrationController.getById);
router.put('/:id/approve-payment', requireEditor, validate(idParamRule), registrationController.approvePayment);
router.put('/:id/unapprove-payment', requireEditor, validate(idParamRule), registrationController.unapprovePayment);
router.put('/:id', requireEditor, validate(updateRegistrationRules), registrationController.update);
router.delete('/:id', requireEditor, validate(idParamRule), registrationController.remove);

module.exports = router;
