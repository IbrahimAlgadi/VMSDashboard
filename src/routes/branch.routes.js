const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');

// API Routes
// GET /api/branches - Get all branches (with optional filters)
router.get('/api/branches', branchController.getAllBranches);

// GET /api/branches/:id - Get branch by ID
router.get('/api/branches/:id', branchController.getBranchById);

// POST /api/branches - Create new branch
router.post('/api/branches', branchController.createBranch);

// PATCH /api/branches/:id - Update branch by ID
router.patch('/api/branches/:id', branchController.updateBranch);

// DELETE /api/branches/:id - Delete branch (soft delete by default, hard delete with ?hardDelete=true)
router.delete('/api/branches/:id', branchController.deleteBranch);

module.exports = router;
