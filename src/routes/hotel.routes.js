const { Router } = require('express');
const hotelController = require('../controllers/hotel.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin, requireEditor } = require('../middleware/auth');
const { uploadExcel } = require('../middleware/upload');
const {
  createRules,
  updateRules,
  idParamRule,
  roomIdParamRule,
  createRoomRules,
  updateRoomRules,
} = require('../validators/hotel.validator');

const router = Router();

// All hotel routes are admin-only
router.use(authGuard, requireAdmin);

router.get('/', hotelController.list);
router.get('/import-template', hotelController.downloadImportTemplate);
router.post('/import-excel', requireEditor, uploadExcel, hotelController.importExcel);
router.post('/', requireEditor, validate(createRules), hotelController.create);
router.get('/:id', validate(idParamRule), hotelController.getById);
router.put('/:id', requireEditor, validate(updateRules), hotelController.update);
router.delete('/:id', requireEditor, validate(idParamRule), hotelController.remove);

router.post('/:id/rooms', requireEditor, validate(createRoomRules), hotelController.createRoom);
router.put('/:id/rooms/:roomId', requireEditor, validate(updateRoomRules), hotelController.updateRoom);
router.delete('/:id/rooms/:roomId', requireEditor, validate(roomIdParamRule), hotelController.removeRoom);

module.exports = router;
