const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

// GET /settings
router.get('/settings', settingsController.showSettings);

module.exports = router;
