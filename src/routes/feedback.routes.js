const { Router } = require('express');
const feedbackController = require('../controllers/feedback.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin } = require('../middleware/auth');
const {
  createRules,
  listQueryRules,
  idParamRule,
} = require('../validators/feedback.validator');

const router = Router();

// Public: devotee submits feedback
router.post('/', validate(createRules), feedbackController.create);

// Admin-only below
router.use(authGuard, requireAdmin);

router.get('/export', feedbackController.export);
router.get('/', validate(listQueryRules), feedbackController.list);
router.get('/:id', validate(idParamRule), feedbackController.getById);

module.exports = router;
