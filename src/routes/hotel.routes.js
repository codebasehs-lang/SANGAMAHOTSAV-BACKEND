const { Router } = require('express');
const hotelController = require('../controllers/hotel.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin } = require('../middleware/auth');
const {
  createRules,
  updateRules,
  idParamRule,
} = require('../validators/hotel.validator');

const router = Router();

// All hotel routes are admin-only
router.use(authGuard, requireAdmin);

router.get('/', hotelController.list);
router.post('/', validate(createRules), hotelController.create);
router.get('/:id', validate(idParamRule), hotelController.getById);
router.put('/:id', validate(updateRules), hotelController.update);
router.delete('/:id', validate(idParamRule), hotelController.remove);

module.exports = router;
