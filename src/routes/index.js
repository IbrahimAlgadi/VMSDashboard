const express = require('express');
const router = express.Router();

// Import all route modules
const dashboardRoutes = require('./dashboard.routes');
const nvrRoutes = require('./nvr.routes');
const cameraRoutes = require('./camera.routes');
const mapRoutes = require('./map.routes');
const alertRoutes = require('./alert.routes');
const complianceRoutes = require('./compliance.routes');
const securityRoutes = require('./security.routes');
const analyticsRoutes = require('./analytics.routes');
const reportRoutes = require('./report.routes');
const settingsRoutes = require('./settings.routes');
const profileRoutes = require('./profile.routes');

// Use all route modules
router.use('/', dashboardRoutes);
router.use('/', nvrRoutes);
router.use('/', cameraRoutes);
router.use('/', mapRoutes);
router.use('/', alertRoutes);
router.use('/', complianceRoutes);
router.use('/', securityRoutes);
router.use('/', analyticsRoutes);
router.use('/', reportRoutes);
router.use('/', settingsRoutes);
router.use('/', profileRoutes);

module.exports = router;
