const express = require('express');
const router = express.Router();
const nvrController = require('../controllers/nvr.controller');

// GET /nvr-management
router.get('/nvr-management', nvrController.showNVRManagement);

// API Routes
// GET /api/nvrs - Get all NVRs (with optional filters)
router.get('/api/nvrs', nvrController.getAllNVRs);

// GET /api/nvrs/:id - Get NVR by ID
router.get('/api/nvrs/:id', nvrController.getNVRById);

// POST /api/nvrs - Create new NVR
router.post('/api/nvrs', nvrController.createNVR);

// PATCH /api/nvrs/:name - Update NVR by name
router.patch('/api/nvrs/name/:name', nvrController.updateNVRByName);

// PATCH /api/nvrs/hostname/:nvr_name - Update NVR by hostname
router.patch('/api/nvrs/hostname/:nvr_name', nvrController.updateNVRByHostname);

// PATCH /api/nvrs/:id - Update NVR by ID
router.patch('/api/nvrs/:id', nvrController.updateNVR);

// DELETE /api/nvrs/:id - Delete NVR (soft delete by default, hard delete with ?hardDelete=true)
router.delete('/api/nvrs/:id', nvrController.deleteNVR);

// POST /api/nvrs/:hostname/metrics - Ingest health metrics from VM/NVR
router.post('/api/nvrs/:hostname/metrics', nvrController.ingestHealthMetrics);

// GET /api/branches - Get all branches for dropdown
router.get('/api/branches', nvrController.getBranches);

module.exports = router;
