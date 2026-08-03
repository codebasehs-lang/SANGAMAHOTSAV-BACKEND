const { Router } = require('express');
const donationController = require('../controllers/donation.controller');
const { authGuard, requireAdmin } = require('../middleware/auth');

/**
 * Donation routes - Admin only
 * GET /api/v1/donations - List donations with filters
 * GET /api/v1/donations/labels - Get unique donation labels
 * GET /api/v1/donations/stats - Get donation statistics
 * GET /api/v1/donations/export - Export donations as JSON
 */
const router = Router();

// All donation routes require admin authentication
router.use(authGuard, requireAdmin);

// List donations with pagination and filters
router.get('/', donationController.list);

// Get unique donation labels for filtering
router.get('/labels', donationController.getLabels);

// Get donation statistics
router.get('/stats', donationController.getStats);

// Export donations
router.get('/export/json', donationController.export);

module.exports = router;
