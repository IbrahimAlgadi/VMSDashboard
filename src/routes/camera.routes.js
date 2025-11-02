const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/camera.controller');

// GET /camera-management
router.get('/camera-management', cameraController.showCameraManagement);

// API Routes
// GET /api/cameras - Get all cameras (with optional filters)
router.get('/api/cameras', cameraController.getAllCameras);

// GET /api/cameras/:id - Get camera by ID
router.get('/api/cameras/:id', cameraController.getCameraById);

// POST /api/cameras - Create new camera
router.post('/api/cameras', cameraController.createCamera);

// PATCH /api/cameras/name/:name - Update camera by name
router.patch('/api/cameras/name/:name', cameraController.updateCameraByName);

// PATCH /api/cameras/:id - Update camera by ID
router.patch('/api/cameras/:id', cameraController.updateCamera);

// DELETE /api/cameras/:id - Delete camera (soft delete by default, hard delete with ?hardDelete=true)
router.delete('/api/cameras/:id', cameraController.deleteCamera);

// GET /api/branches - Get all branches for dropdown
router.get('/api/branches', cameraController.getBranches);

// GET /api/nvrs/dropdown - Get all NVRs for dropdown (simplified format)
router.get('/api/nvrs/dropdown', cameraController.getNVRs);

// GET /api/nvrs/by-branch/:branchId - Get NVRs by branch
router.get('/api/nvrs/by-branch/:branchId', cameraController.getNVRsByBranch);

module.exports = router;
