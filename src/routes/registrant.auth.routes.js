const { Router } = require('express');
const registrantAuthController = require('../controllers/registrantAuth.controller');
const { authGuard } = require('../middleware/auth');
const {
	uploadRegistrantProfilePhoto,
	uploadPaymentScreenshot,
} = require('../middleware/upload');

const router = Router();

router.post('/login', registrantAuthController.login);
router.get('/me', authGuard, registrantAuthController.me);
router.put('/change-password', authGuard, registrantAuthController.changePassword);
router.put(
	'/profile-photo',
	authGuard,
	uploadRegistrantProfilePhoto,
	registrantAuthController.updateProfilePhoto
);
router.put(
	'/family-member-relationship',
	authGuard,
	registrantAuthController.updateFamilyMemberRelationship
);
router.put(
	'/payment-screenshot',
	authGuard,
	uploadPaymentScreenshot,
	registrantAuthController.updatePaymentScreenshot
);

module.exports = router;
