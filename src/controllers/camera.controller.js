const { Camera, NVR, Branch } = require('../models');
const MOCK_DATA = require('../config/constants');

class CameraController {
  // GET /camera-management
  async showCameraManagement(req, res) {
    try {
      const cameras = await Camera.findAll({
        include: [
          { model: NVR, as: 'nvr', attributes: ['id', 'device_name'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ],
        attributes: ['id', 'name', 'position', 'nvr_id', 'branch_id', 'ip_address', 
                     'model', 'manufacturer', 'resolution', 'fps', 'uptime_percent', 'status'],
        order: [['name', 'ASC']]
      }).catch(() => []);

      // Transform database results to frontend format
      const transformedCameras = cameras.length > 0 ? cameras.map(camera => ({
        id: camera.id,
        name: camera.name,
        position: camera.position,
        nvr: camera.nvr?.device_name || 'Unknown',
        branch: camera.branch?.name || 'Unknown',
        location: camera.branch?.name || 'Unknown', // Add for frontend compatibility
        region: 'Unknown', // Will be populated from branch region if needed
        status: camera.status || 'offline', // Use database status field
        uptime: parseFloat(camera.uptime_percent) || 0,
        ipAddress: camera.ip_address,
        model: camera.model || 'Unknown',
        manufacturer: camera.manufacturer || 'Unknown',
        resolution: camera.resolution || 'Unknown',
        fps: camera.fps || 0
      })) : [];

      // Calculate statistics
      const summary = transformedCameras.length > 0 ? {
        total: transformedCameras.length,
        online: transformedCameras.filter(c => c.status === 'online').length,
        offline: transformedCameras.filter(c => c.status === 'offline').length,
        warning: transformedCameras.filter(c => c.status === 'warning').length
      } : (MOCK_DATA.cameras?.summary || { total: 0, online: 0, offline: 0, warning: 0 });

      // Use database data if available, otherwise use mock data
      const cameraList = transformedCameras.length > 0 ? transformedCameras : (MOCK_DATA.cameras?.cameras || []);

      res.render('camera-management', {
        title: 'Camera Management',
        currentPage: 'camera-management',
        cameras: cameraList,
        summary: summary
      });
    } catch (error) {
      console.error('Error loading cameras:', error);
      // Fallback to mock data
      res.render('camera-management', {
        title: 'Camera Management',
        currentPage: 'camera-management',
        cameras: MOCK_DATA.cameras?.cameras || [],
        summary: MOCK_DATA.cameras?.summary || { total: 0, online: 0, offline: 0, warning: 0 }
      });
    }
  }
}

module.exports = new CameraController();
