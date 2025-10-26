const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

// GET /reports
router.get('/reports', reportController.showReports);

module.exports = router;
