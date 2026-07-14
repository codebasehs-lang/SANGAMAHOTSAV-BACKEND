const { Router } = require('express');
const seminarHallController = require('../controllers/seminarHall.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin, requireEditor } = require('../middleware/auth');
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
router.post('/', requireEditor, validate(createRules), seminarHallController.create);
router.get('/:id', validate(idParamRule), seminarHallController.getById);
router.put('/:id', requireEditor, validate(updateRules), seminarHallController.update);
router.patch('/:id/activate', requireEditor, validate(idParamRule), seminarHallController.activate);
router.delete('/:id', requireEditor, validate(idParamRule), seminarHallController.remove);

module.exports = router;
