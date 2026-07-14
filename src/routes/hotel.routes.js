const { Router } = require('express');
const hotelController = require('../controllers/hotel.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin, requireEditor } = require('../middleware/auth');
const {
  createRules,
  updateRules,
  idParamRule,
} = require('../validators/hotel.validator');

const router = Router();

// All hotel routes are admin-only
router.use(authGuard, requireAdmin);

router.get('/', hotelController.list);
router.post('/', requireEditor, validate(createRules), hotelController.create);
router.get('/:id', validate(idParamRule), hotelController.getById);
router.put('/:id', requireEditor, validate(updateRules), hotelController.update);
router.delete('/:id', requireEditor, validate(idParamRule), hotelController.remove);

module.exports = router;
