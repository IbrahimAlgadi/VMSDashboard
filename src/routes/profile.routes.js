const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

// GET /profile
router.get('/profile', profileController.showProfile);

module.exports = router;
