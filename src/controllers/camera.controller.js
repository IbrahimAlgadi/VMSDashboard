const { Camera, NVR, Branch, Region, CameraHealthMetrics } = require('../models');
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
      const transformedCameras = cameras.length > 0 ? await Promise.all(cameras.map(async (camera) => {
        // Fetch latest health metrics for this camera
        const healthMetrics = await CameraHealthMetrics.findOne({
          where: { 
            camera_id: camera.id,
            is_active: true 
          },
          order: [['last_health_check', 'DESC']],
          attributes: [
            'ping_ms',
            'packet_loss_percent', 
            'bandwidth_mbps',
            'bitrate_kbps',
            'frame_drop_percent',
            'quality_score',
            'recording_time_days',
            'space_used_gb',
            'retention_days',
            'motion_events_today',
            'alerts_pending',
            'last_reboot_date',
            'last_health_check'
          ]
        }).catch(() => null);

        return {
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
          fps: camera.fps || 0,
          // Health metrics data
          healthMetrics: healthMetrics ? {
            pingMs: parseFloat(healthMetrics.ping_ms),
            packetLoss: parseFloat(healthMetrics.packet_loss_percent),
            bandwidthMbps: parseFloat(healthMetrics.bandwidth_mbps),
            bitrateKbps: parseInt(healthMetrics.bitrate_kbps),
            frameDropPercent: parseFloat(healthMetrics.frame_drop_percent),
            qualityScore: parseInt(healthMetrics.quality_score),
            recordingTimeDays: parseInt(healthMetrics.recording_time_days),
            spaceUsedGb: parseFloat(healthMetrics.space_used_gb),
            retentionDays: parseInt(healthMetrics.retention_days),
            motionEventsToday: parseInt(healthMetrics.motion_events_today),
            alertsPending: parseInt(healthMetrics.alerts_pending),
            lastRebootDate: healthMetrics.last_reboot_date,
            lastHealthCheck: healthMetrics.last_health_check
          } : null
        };
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

  // POST /api/cameras - Create new camera
  async createCamera(req, res) {
    try {
      const {
        name,
        position,
        ip_address,
        branch_id,
        nvr_id,
        status = 'offline',
        model,
        manufacturer,
        resolution,
        fps = 25,
        bitrate,
        edge_storage_size,
        uptime_percent = 0.00
      } = req.body;

      // Validate required fields
      if (!name || !position || !ip_address || !branch_id || !nvr_id) {
        return res.status(400).json({
          success: false,
          message: 'Camera name, position, IP address, branch, and NVR are required'
        });
      }

      // Check if camera name already exists
      const existingCamera = await Camera.findOne({
        where: { name }
      });

      if (existingCamera) {
        return res.status(400).json({
          success: false,
          message: 'A camera with this name already exists'
        });
      }

      // Check if IP address already exists
      const existingIP = await Camera.findOne({
        where: { ip_address }
      });

      if (existingIP) {
        return res.status(400).json({
          success: false,
          message: 'A camera with this IP address already exists'
        });
      }

      // Verify branch exists
      const branch = await Branch.findByPk(branch_id);
      if (!branch) {
        return res.status(400).json({
          success: false,
          message: 'Selected branch does not exist'
        });
      }

      // Verify NVR exists
      const nvr = await NVR.findByPk(nvr_id);
      if (!nvr) {
        return res.status(400).json({
          success: false,
          message: 'Selected NVR does not exist'
        });
      }

      // Check if NVR belongs to the same branch
      if (nvr.branch_id !== parseInt(branch_id)) {
        return res.status(400).json({
          success: false,
          message: 'Selected NVR does not belong to the selected branch'
        });
      }

      // Create the camera
      const newCamera = await Camera.create({
        name,
        position,
        ip_address,
        branch_id,
        nvr_id,
        status,
        model: model || null,
        manufacturer: manufacturer || null,
        resolution: resolution || null,
        fps: parseInt(fps),
        bitrate: bitrate ? parseInt(bitrate) : null,
        edge_storage_size: edge_storage_size ? parseInt(edge_storage_size) : null,
        uptime_percent: parseFloat(uptime_percent)
      });

      // Fetch the created camera with related data
      const createdCamera = await Camera.findByPk(newCamera.id, {
        include: [
          { model: NVR, as: 'nvr', attributes: ['id', 'device_name'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Camera created successfully',
        data: {
          id: createdCamera.id,
          name: createdCamera.name,
          position: createdCamera.position,
          ip_address: createdCamera.ip_address,
          status: createdCamera.status,
          branch: createdCamera.branch?.name || 'Unknown',
          nvr: createdCamera.nvr?.device_name || 'Unknown',
          model: createdCamera.model,
          manufacturer: createdCamera.manufacturer,
          resolution: createdCamera.resolution,
          fps: createdCamera.fps,
          uptime_percent: createdCamera.uptime_percent
        }
      });

    } catch (error) {
      console.error('Error creating camera:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating camera'
      });
    }
  }

  // GET /api/branches - Get all branches for dropdown
  async getBranches(req, res) {
    try {
      const branches = await Branch.findAll({
        include: [{
          model: Region,
          as: 'region',
          attributes: ['id', 'name']
        }],
        where: { is_active: true },
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'branch_code', 'branch_type']
      });

      const formattedBranches = branches.map(branch => ({
        id: branch.id,
        name: branch.name,
        code: branch.branch_code,
        type: branch.branch_type,
        region: branch.region?.name || 'Unknown'
      }));

      res.json({
        success: true,
        data: formattedBranches
      });

    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching branches'
      });
    }
  }

  // GET /api/nvrs - Get all NVRs for dropdown
  async getNVRs(req, res) {
    try {
      const nvrs = await NVR.findAll({
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }],
        where: { is_active: true },
        order: [['device_name', 'ASC']],
        attributes: ['id', 'device_name', 'branch_id', 'max_cameras', 'current_cameras']
      });

      const formattedNVRs = nvrs.map(nvr => ({
        id: nvr.id,
        device_name: nvr.device_name,
        branch_id: nvr.branch_id,
        branch_name: nvr.branch?.name || 'Unknown',
        max_cameras: nvr.max_cameras,
        current_cameras: nvr.current_cameras,
        available_slots: nvr.max_cameras - nvr.current_cameras
      }));

      res.json({
        success: true,
        data: formattedNVRs
      });

    } catch (error) {
      console.error('Error fetching NVRs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching NVRs'
      });
    }
  }

  // GET /api/nvrs/by-branch/:branchId - Get NVRs by branch
  async getNVRsByBranch(req, res) {
    try {
      const { branchId } = req.params;
      
      const nvrs = await NVR.findAll({
        where: { 
          branch_id: branchId,
          is_active: true 
        },
        order: [['device_name', 'ASC']],
        attributes: ['id', 'device_name', 'max_cameras', 'current_cameras']
      });

      const formattedNVRs = nvrs.map(nvr => ({
        id: nvr.id,
        device_name: nvr.device_name,
        max_cameras: nvr.max_cameras,
        current_cameras: nvr.current_cameras,
        available_slots: nvr.max_cameras - nvr.current_cameras
      }));

      res.json({
        success: true,
        data: formattedNVRs
      });

    } catch (error) {
      console.error('Error fetching NVRs by branch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching NVRs'
      });
    }
  }
}

module.exports = new CameraController();
