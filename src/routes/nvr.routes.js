const express = require('express');
const router = express.Router();
const nvrController = require('../controllers/nvr.controller');

// GET /nvr-management
router.get('/nvr-management', nvrController.showNVRManagement);

module.exports = router;
