const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');

// GET /map
router.get('/map', mapController.showMap);

module.exports = router;
