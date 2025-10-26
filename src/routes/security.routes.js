const express = require('express');
const router = express.Router();
const securityController = require('../controllers/security.controller');

// GET /security
router.get('/security', securityController.showSecurity);

module.exports = router;
