const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// GET /analytics
router.get('/analytics', analyticsController.showAnalytics);

module.exports = router;
