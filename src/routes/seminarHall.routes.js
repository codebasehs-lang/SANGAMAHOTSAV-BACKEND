const { Router } = require('express');
const seminarHallController = require('../controllers/seminarHall.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin } = require('../middleware/auth');
const {
  createRules,
  updateRules,
  idParamRule,
} = require('../validators/seminarHall.validator');

const router = Router();

// All seminar hall routes are admin-only
router.use(authGuard, requireAdmin);

router.get('/active', seminarHallController.getActive);
router.get('/', seminarHallController.list);
router.post('/', validate(createRules), seminarHallController.create);
router.get('/:id', validate(idParamRule), seminarHallController.getById);
router.put('/:id', validate(updateRules), seminarHallController.update);
router.patch('/:id/activate', validate(idParamRule), seminarHallController.activate);
router.delete('/:id', validate(idParamRule), seminarHallController.remove);

module.exports = router;
