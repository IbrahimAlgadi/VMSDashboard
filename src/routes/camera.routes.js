const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/camera.controller');

// GET /camera-management
router.get('/camera-management', cameraController.showCameraManagement);

module.exports = router;
