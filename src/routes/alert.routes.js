const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');

// GET /alerts
router.get('/alerts', alertController.showAlerts);

module.exports = router;
