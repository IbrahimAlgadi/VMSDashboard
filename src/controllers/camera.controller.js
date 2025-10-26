const MOCK_DATA = require('../config/constants');

class CameraController {
  // GET /camera-management
  showCameraManagement(req, res) {
    res.render('camera-management', {
      title: 'Camera Management',
      currentPage: 'camera-management',
      cameras: MOCK_DATA.cameras
    });
  }
}

module.exports = new CameraController();
