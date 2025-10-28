const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/camera.controller');

// GET /camera-management
router.get('/camera-management', cameraController.showCameraManagement);

// API Routes
// POST /api/cameras - Create new camera
router.post('/api/cameras', cameraController.createCamera);

// GET /api/branches - Get all branches for dropdown
router.get('/api/branches', cameraController.getBranches);

// GET /api/nvrs - Get all NVRs for dropdown
router.get('/api/nvrs', cameraController.getNVRs);

// GET /api/nvrs/by-branch/:branchId - Get NVRs by branch
router.get('/api/nvrs/by-branch/:branchId', cameraController.getNVRsByBranch);

module.exports = router;
