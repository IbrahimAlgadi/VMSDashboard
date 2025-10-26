const { Camera, NVR, Branch } = require('../models');
const MOCK_DATA = require('../config/constants');

class CameraController {
  // GET /camera-management
  async showCameraManagement(req, res) {
    try {
      const cameras = await Camera.findAll({
        include: [
          { model: NVR, as: 'nvr', attributes: ['id', 'name'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ],
        where: { is_active: true },
        order: [['name', 'ASC']]
      }).catch(() => []);

      // Use database data if available, otherwise use mock data
      const cameraList = cameras.length > 0 ? cameras : MOCK_DATA.cameras;

      res.render('camera-management', {
        title: 'Camera Management',
        currentPage: 'camera-management',
        cameras: cameraList
      });
    } catch (error) {
      console.error('Error loading cameras:', error);
      // Fallback to mock data
      res.render('camera-management', {
        title: 'Camera Management',
        currentPage: 'camera-management',
        cameras: MOCK_DATA.cameras
      });
    }
  }
}

module.exports = new CameraController();
