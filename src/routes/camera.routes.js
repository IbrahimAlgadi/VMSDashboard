const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/camera.controller');

// GET /camera-management
router.get('/camera-management', cameraController.showCameraManagement);

// API Routes
// GET /api/cameras - Get all cameras (with optional filters)
router.get('/api/cameras', cameraController.getAllCameras);

// GET /api/cameras/by-id/:id - Get camera by numeric ID
router.get('/api/cameras/by-id/:id', cameraController.getCameraById);

// GET /api/cameras/by-name/:name - Get camera by name
router.get('/api/cameras/by-name/:name', cameraController.getCameraByName);

// POST /api/cameras - Create new camera
router.post('/api/cameras', cameraController.createCamera);

// PATCH /api/cameras/by-id/:id - Update camera by numeric ID
router.patch('/api/cameras/by-id/:id', cameraController.updateCameraById);

// PATCH /api/cameras/by-name/:name - Update camera by name
router.patch('/api/cameras/by-name/:name', cameraController.updateCameraByName);

// DELETE /api/cameras/by-id/:id - Delete camera by numeric ID (soft delete by default, hard delete with ?hardDelete=true)
router.delete('/api/cameras/by-id/:id', cameraController.deleteCameraById);

// DELETE /api/cameras/by-name/:name - Delete camera by name (soft delete by default, hard delete with ?hardDelete=true)
router.delete('/api/cameras/by-name/:name', cameraController.deleteCameraByName);

// GET /api/branches - Get all branches for dropdown
router.get('/api/branches', cameraController.getBranches);

// GET /api/nvrs/dropdown - Get all NVRs for dropdown (simplified format)
router.get('/api/nvrs/dropdown', cameraController.getNVRs);

// GET /api/nvrs/by-branch/:branchId - Get NVRs by branch
router.get('/api/nvrs/by-branch/:branchId', cameraController.getNVRsByBranch);

// PATCH /api/cameras/ingest-comprehensive-data/:hostname/:ip_address - Ingest comprehensive camera data
// Using regex pattern to properly match IP addresses (allows dots in IP address)
router.patch('/api/cameras/ingest-comprehensive-data/:hostname/:ip_address([0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3})', cameraController.ingestComprehensiveData);

module.exports = router;
