const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// GET /
router.get('/', dashboardController.showDashboard);

module.exports = router;
