const express = require('express');
const router = express.Router();
const initializationController = require('../controllers/initialization.controller');

// POST /api/initialize - Bulk initialization of regions, branches, NVRs and cameras
router.post('/api/initialize', initializationController.initializeSystem);

// GET /api/initialize/schema - Get JSON schema for initialization API
router.get('/api/initialize/schema', initializationController.getSchema);

// GET /api/initialize/status - Get current system status
router.get('/api/initialize/status', initializationController.getSystemStatus);

module.exports = router;
