const express = require('express');
const router = express.Router();
const nvrController = require('../controllers/nvr.controller');

// GET /nvr-management
router.get('/nvr-management', nvrController.showNVRManagement);

// API Routes
// POST /api/nvrs - Create new NVR
router.post('/api/nvrs', nvrController.createNVR);

// GET /api/branches - Get all branches for dropdown
router.get('/api/branches', nvrController.getBranches);

module.exports = router;
