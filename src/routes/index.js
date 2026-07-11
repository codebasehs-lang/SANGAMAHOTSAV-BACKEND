const { Router } = require('express');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Root API router. Feature routers (auth, registrations, etc.)
 * will be mounted here in later phases.
 */
const router = Router();

router.get('/health', (req, res) =>
  ApiResponse.send(res, {
    message: 'Service is healthy',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  })
);

// Feature routes (mounted in later phases):
router.use('/auth', require('./auth.routes'));
router.use('/registrations', require('./registration.routes'));
router.use('/accommodations', require('./accommodation.routes'));
router.use('/hotels', require('./hotel.routes'));
router.use('/seminar-halls', require('./seminarHall.routes'));
router.use('/sms', require('./sms.routes'));
router.use('/feedbacks', require('./feedback.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
