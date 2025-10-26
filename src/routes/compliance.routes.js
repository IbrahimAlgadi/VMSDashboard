const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/compliance.controller');

// GET /compliance
router.get('/compliance', complianceController.showCompliance);

module.exports = router;
