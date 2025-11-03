const { Camera, NVR, Branch, Region, CameraHealthMetrics, Alert } = require('../models');
const MOCK_DATA = require('../config/constants');
const { 
  validateComprehensiveData, 
  extractCameraIP, 
  processComprehensiveData,
  isValidIPAddress,
  updateNVRStatus,
  isValidNumericId
} = require('../utils/validation');

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
                     'model', 'manufacturer', 'resolution', 'fps', 'bitrate', 'uptime_percent', 'status', 'edge_storage_size', 'edge_storage_retention'],
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
            'edge_storage_size_gb',
            'storage_total_gb',
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
          bitrate: camera.bitrate !== null && camera.bitrate !== undefined ? camera.bitrate : null,
          edgeStorageSize: camera.edge_storage_size !== null && camera.edge_storage_size !== undefined ? camera.edge_storage_size : null,
          edgeStorageRetention: camera.edge_storage_retention !== null && camera.edge_storage_retention !== undefined ? camera.edge_storage_retention : null,
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
            edgeStorageSizeGb: parseFloat(healthMetrics.edge_storage_size_gb) || null,
            storageTotalGb: parseFloat(healthMetrics.storage_total_gb) || null,
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
        edge_storage_retention,
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
        edge_storage_retention: edge_storage_retention ? parseInt(edge_storage_retention) : null,
        uptime_percent: parseFloat(uptime_percent)
      });

      // Update NVR status since a new camera was added
      await updateNVRStatus(NVR, Camera, nvr_id);

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

  // GET /api/cameras - Get all cameras
  async getAllCameras(req, res) {
    try {
      const { branch_id, nvr_id, status, is_active } = req.query;

      const where = {};
      if (branch_id) where.branch_id = branch_id;
      if (nvr_id) where.nvr_id = nvr_id;
      if (status) where.status = status;
      // Note: Camera model doesn't have is_active field, so we'll skip it

      const cameras = await Camera.findAll({
        include: [
          {
            model: NVR,
            as: 'nvr',
            attributes: ['id', 'device_name']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'branch_code'],
            include: [{
              model: Region,
              as: 'region',
              attributes: ['id', 'name', 'code']
            }]
          }
        ],
        where,
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: cameras
      });

    } catch (error) {
      console.error('Error fetching cameras:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching cameras'
      });
    }
  }

  // GET /api/cameras/:id - Get camera by ID
  async getCameraById(req, res) {
    try {
      const { id } = req.params;

      // Validate that ID is numeric
      if (!isValidNumericId(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid camera ID format. Expected numeric ID, got: "${id}". Use /api/cameras/by-name/${encodeURIComponent(id)} if you meant to search by name.`
        });
      }

      const camera = await Camera.findByPk(parseInt(id, 10), {
        include: [
          {
            model: NVR,
            as: 'nvr',
            attributes: ['id', 'device_name', 'ip_address']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'branch_code'],
            include: [{
              model: Region,
              as: 'region',
              attributes: ['id', 'name', 'code']
            }]
          }
        ]
      });

      if (!camera) {
        return res.status(404).json({
          success: false,
          message: `Camera with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        data: camera
      });

    } catch (error) {
      console.error('Error fetching camera:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching camera'
      });
    }
  }

  // GET /api/cameras/by-name/:name - Get camera by name
  async getCameraByName(req, res) {
    try {
      const { name } = req.params;

      // Find camera by name
      const camera = await Camera.findOne({
        where: { name: name },
        include: [
          {
            model: NVR,
            as: 'nvr',
            attributes: ['id', 'device_name', 'ip_address']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'branch_code'],
            include: [{
              model: Region,
              as: 'region',
              attributes: ['id', 'name', 'code']
            }]
          }
        ]
      });

      if (!camera) {
        return res.status(404).json({
          success: false,
          message: `Camera with name "${name}" not found`
        });
      }

      res.json({
        success: true,
        data: camera
      });

    } catch (error) {
      console.error('Error getting camera by name:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching camera'
      });
    }
  }

  // PATCH /api/cameras/:name - Update camera by name
  async updateCameraByName(req, res) {
    try {
      const { name } = req.params;
      const updateData = req.body;

      // Find camera by name
      const camera = await Camera.findOne({
        where: { name: name }
      });

      if (!camera) {
        return res.status(404).json({
          success: false,
          message: `Camera with name "${name}" not found`
        });
      }

      // Validate status if provided
      if (updateData.status && !['online', 'offline', 'warning', 'maintenance'].includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: online, offline, warning, maintenance'
        });
      }

      // Store original status for comparison
      const originalStatus = camera.status;

      // Update the camera
      await camera.update(updateData);

      // Update NVR status if camera status was changed
      if (updateData.status && updateData.status !== originalStatus) {
        await updateNVRStatus(NVR, Camera, camera.nvr_id);
      }

      res.json({
        success: true,
        message: 'Camera updated successfully',
        data: {
          id: camera.id,
          name: camera.name,
          status: camera.status,
          position: camera.position,
          uptime_percent: camera.uptime_percent
        }
      });

    } catch (error) {
      console.error('Error updating camera:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating camera'
      });
    }
  }

  // PATCH /api/cameras/by-id/:id - Update camera by numeric ID
  async updateCameraById(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate that ID is numeric
      if (!isValidNumericId(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid camera ID format. Expected numeric ID, got: "${id}". Use /api/cameras/by-name/${encodeURIComponent(id)} if you meant to search by name.`
        });
      }

      const camera = await Camera.findByPk(parseInt(id, 10));

      if (!camera) {
        return res.status(404).json({
          success: false,
          message: `Camera with ID ${id} not found`
        });
      }

      // Validate status if provided
      if (updateData.status && !['online', 'offline', 'warning', 'maintenance'].includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: online, offline, warning, maintenance'
        });
      }

      // Check if name is being updated and already exists
      if (updateData.name && updateData.name !== camera.name) {
        const existingCamera = await Camera.findOne({
          where: { name: updateData.name }
        });

        if (existingCamera) {
          return res.status(400).json({
            success: false,
            message: 'A camera with this name already exists'
          });
        }
      }

      // Check if IP address is being updated and already exists
      if (updateData.ip_address && updateData.ip_address !== camera.ip_address) {
        const existingIP = await Camera.findOne({
          where: { ip_address: updateData.ip_address }
        });

        if (existingIP) {
          return res.status(400).json({
            success: false,
            message: 'A camera with this IP address already exists'
          });
        }
      }

      // Verify NVR exists if nvr_id is being updated
      if (updateData.nvr_id && updateData.nvr_id !== camera.nvr_id) {
        const nvr = await NVR.findByPk(updateData.nvr_id);
        if (!nvr) {
          return res.status(400).json({
            success: false,
            message: 'Selected NVR does not exist'
          });
        }
      }

      // Verify branch exists if branch_id is being updated
      if (updateData.branch_id && updateData.branch_id !== camera.branch_id) {
        const branch = await Branch.findByPk(updateData.branch_id);
        if (!branch) {
          return res.status(400).json({
            success: false,
            message: 'Selected branch does not exist'
          });
        }
      }

      // Update the camera
      await camera.update(updateData);

      // Update NVR status if camera status was changed
      if (updateData.status && updateData.status !== camera.status) {
        await updateNVRStatus(NVR, Camera, camera.nvr_id);
      }

      // Fetch updated camera with relationships
      const updatedCamera = await Camera.findByPk(parseInt(id, 10), {
        include: [
          {
            model: NVR,
            as: 'nvr',
            attributes: ['id', 'device_name']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Camera updated successfully',
        data: updatedCamera
      });

    } catch (error) {
      console.error('Error updating camera:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating camera'
      });
    }
  }

  // DELETE /api/cameras/:id - Delete camera by ID
  async deleteCameraById(req, res) {
    try {
      const { id } = req.params;

      // Validate that ID is numeric
      if (!isValidNumericId(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid camera ID format. Expected numeric ID, got: "${id}".`
        });
      }

      const camera = await Camera.findByPk(parseInt(id, 10));

      if (!camera) {
        return res.status(404).json({
          success: false,
          message: `Camera with ID ${id} not found`
        });
      }

      const { hardDelete } = req.query;

      if (hardDelete === 'true') {
        // Hard delete
        await camera.destroy();
        return res.json({
          success: true,
          message: 'Camera deleted successfully'
        });
      } else {
        // Soft delete - update status to offline and optionally remove from NVR count
        await camera.update({ status: 'offline' });
        
        // Update NVR status since camera went offline
        await updateNVRStatus(NVR, Camera, camera.nvr_id);
        
        // Decrease NVR current_cameras count if needed
        const nvr = await NVR.findByPk(camera.nvr_id);
        if (nvr && nvr.current_cameras > 0) {
          await nvr.update({
            current_cameras: nvr.current_cameras - 1
          });
        }

        return res.json({
          success: true,
          message: 'Camera deactivated successfully',
          data: {
            id: camera.id,
            name: camera.name,
            status: 'offline'
          }
        });
      }

    } catch (error) {
      console.error('Error deleting camera:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting camera'
      });
    }
  }

  // DELETE /api/cameras/by-name/:name - Delete camera by name
  async deleteCameraByName(req, res) {
    try {
      const { name } = req.params;

      // Find camera by name
      const camera = await Camera.findOne({
        where: { name: name }
      });

      if (!camera) {
        return res.status(404).json({
          success: false,
          message: `Camera with name "${name}" not found`
        });
      }

      const { hardDelete } = req.query;

      if (hardDelete === 'true') {
        // Hard delete
        await camera.destroy();
        return res.json({
          success: true,
          message: 'Camera deleted successfully'
        });
      } else {
        // Soft delete - update status to offline and optionally remove from NVR count
        await camera.update({ status: 'offline' });
        
        // Update NVR status since camera went offline
        await updateNVRStatus(NVR, Camera, camera.nvr_id);
        
        // Decrease NVR current_cameras count if needed
        const nvr = await NVR.findByPk(camera.nvr_id);
        if (nvr && nvr.current_cameras > 0) {
          await nvr.update({
            current_cameras: nvr.current_cameras - 1
          });
        }

        return res.json({
          success: true,
          message: 'Camera deactivated successfully',
          data: {
            id: camera.id,
            name: camera.name,
            status: 'offline'
          }
        });
      }

    } catch (error) {
      console.error('Error deleting camera by name:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting camera'
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

  /**
   * PATCH /api/cameras/ingest-comprehensive-data/:hostname/:ip_address
   * Ingest comprehensive camera data and update database
   */
  async ingestComprehensiveData(req, res) {
    const { hostname, ip_address } = req.params;
    const comprehensiveData = req.body;
    
    try {
      // Validate input data
      const validation = validateComprehensiveData(comprehensiveData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid comprehensive data format',
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
      
      // Validate hostname parameter
      if (!hostname || hostname.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Hostname parameter is required'
        });
      }
      
      // Validate IP address parameter
      if (!isValidIPAddress(ip_address)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid IP address format'
        });
      }
      
      // Find NVR by hostname first to verify it exists
      const nvr = await NVR.findOne({
        where: { hostname: hostname.trim() },
        attributes: ['id', 'device_name', 'hostname']
      });
      
      if (!nvr) {
        return res.status(404).json({
          success: false,
          message: `NVR with hostname "${hostname}" not found in database`
        });
      }
      
      // Verify the IP in data matches parameter
      const dataIP = extractCameraIP(comprehensiveData.metadata);
      if (dataIP && dataIP !== ip_address) {
        return res.status(400).json({
          success: false,
          message: `IP address mismatch: parameter (${ip_address}) vs data (${dataIP})`
        });
      }
      
      // Find camera by IP address AND NVR ID to handle cases where multiple cameras share the same IP
      const camera = await Camera.findOne({ 
        where: { 
          ip_address,
          nvr_id: nvr.id
        },
        include: [
          { model: NVR, as: 'nvr', attributes: ['id', 'device_name', 'hostname'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ]
      });
      
      if (!camera) {
        return res.status(404).json({
          success: false,
          message: `Camera with IP address ${ip_address} not found for NVR with hostname "${hostname}" in database`
        });
      }
      
      // Optional: Verify NVR hostname match if provided in data
      if (comprehensiveData.metadata?.nvr_hostname && 
          camera.nvr?.hostname !== comprehensiveData.metadata.nvr_hostname) {
        console.warn(`NVR hostname mismatch for camera ${ip_address}: expected ${camera.nvr?.hostname}, got ${comprehensiveData.metadata.nvr_hostname}`);
      }
      
      // Process the comprehensive data
      const processedData = processComprehensiveData(comprehensiveData);
      
      // Update database in transaction
      const result = await Camera.sequelize.transaction(async (t) => {
        const updates = {
          camera: false,
          healthMetrics: false,
          alerts: 0,
          statusChanged: false
        };
        
        // 1. Update camera basic info
        const oldStatus = camera.status;
        const basicInfo = processedData.basicInfo;
        
        // Prepare update object with all available fields
        const cameraUpdate = {
          status: processedData.status,
          updated_at: new Date()
        };
        
        // Update fields if they exist in the processed data
        if (basicInfo.manufacturer) cameraUpdate.manufacturer = basicInfo.manufacturer;
        if (basicInfo.model) cameraUpdate.model = basicInfo.model;
        if (basicInfo.resolution) cameraUpdate.resolution = basicInfo.resolution;
        if (basicInfo.fps !== null && basicInfo.fps !== undefined) cameraUpdate.fps = basicInfo.fps;
        if (basicInfo.bitrate !== null && basicInfo.bitrate !== undefined) {
          cameraUpdate.bitrate = basicInfo.bitrate;
        }
        
        // Update edge storage size from health metrics if available
        if (processedData.healthMetrics.edge_storage_size_gb) {
          cameraUpdate.edge_storage_size = Math.round(processedData.healthMetrics.edge_storage_size_gb);
        }
        
        // Update edge storage retention from health metrics if available
        if (processedData.healthMetrics.retention_days !== null && processedData.healthMetrics.retention_days !== undefined) {
          cameraUpdate.edge_storage_retention = processedData.healthMetrics.retention_days;
        }
        
        // Only update if we have new information
        if (Object.keys(cameraUpdate).length > 2) { // More than just status and updated_at
          await camera.update(cameraUpdate, { transaction: t });
          updates.camera = true;
          updates.statusChanged = oldStatus !== processedData.status;
        } else if (oldStatus !== processedData.status) {
          // Update status even if no other fields changed
          await camera.update({ status: processedData.status }, { transaction: t });
          updates.statusChanged = true;
        }
        
        // 2. Update/create health metrics
        const [healthMetrics, created] = await CameraHealthMetrics.upsert({
          camera_id: camera.id,
          ...processedData.healthMetrics
        }, { 
          transaction: t,
          returning: true
        });
        updates.healthMetrics = true;
        
        // 3. Create alerts for critical system events
        for (const alertData of processedData.alerts) {
          await Alert.create({
            ...alertData,
            source_id: camera.id,
            branch_id: camera.branch_id
          }, { transaction: t });
          updates.alerts++;
        }
        
        return updates;
      });
      
      // Update NVR status if camera status changed
      if (result.statusChanged) {
        await updateNVRStatus(NVR, Camera, camera.nvr_id);
      }
      
      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn(`Camera ${ip_address} data warnings:`, validation.warnings);
      }
      
      res.json({
        success: true,
        message: 'Comprehensive camera data processed successfully',
        camera: {
          id: camera.id,
          name: camera.name,
          ip_address: camera.ip_address,
          previous_status: result.statusChanged ? 
            (camera.status === 'online' ? 'offline' : 'online') : camera.status,
          current_status: processedData.status
        },
        processed: {
          basic_info_updated: result.camera,
          health_metrics_updated: result.healthMetrics,
          alerts_created: result.alerts,
          status_changed: result.statusChanged,
          data_timestamp: comprehensiveData.metadata?.timestamp,
          processing_timestamp: new Date().toISOString()
        },
        warnings: validation.warnings
      });
      
    } catch (error) {
      console.error('Error processing comprehensive camera data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while processing camera data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new CameraController();
