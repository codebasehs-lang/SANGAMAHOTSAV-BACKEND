const { Router } = require('express');
const accommodationController = require('../controllers/accommodation.controller');
const validate = require('../middleware/validate');
const { authGuard, requireAdmin } = require('../middleware/auth');
const {
  assignRules,
  updateRules,
  registrationIdParam,
  listQueryRules,
} = require('../validators/accommodation.validator');

const router = Router();

// All accommodation routes are admin-only
router.use(authGuard, requireAdmin);

router.get('/', validate(listQueryRules), accommodationController.list);

// Assign (create or upsert) accommodation for a registration
router.post(
  '/:registrationId',
  validate(assignRules),
  accommodationController.assign
);

// Read the assignment for a registration
router.get(
  '/registration/:registrationId',
  validate(registrationIdParam),
  accommodationController.getByRegistration
);

// Update an assignment by its own id
router.put('/:id', validate(updateRules), accommodationController.update);

module.exports = router;
