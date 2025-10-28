const { NVR, Branch, Region, NVRHealthMetrics } = require('../models');
const MOCK_DATA = require('../config/constants');

class NVRController {
  // GET /nvr-management
  async showNVRManagement(req, res) {
    try {
      const nvrs = await NVR.findAll({
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name'],
            include: [{
              model: Region,
              as: 'region',
              attributes: ['id', 'name']
            }]
          }
        ],
        where: { is_active: true },
        order: [['device_name', 'ASC']]
      }).catch(() => []);

      // Transform database results to frontend format
      const transformedNVRs = nvrs.length > 0 ? await Promise.all(nvrs.map(async (nvr) => {
        // Fetch latest health metrics for this NVR
        const healthMetrics = await NVRHealthMetrics.findOne({
          where: { 
            nvr_id: nvr.id,
            is_active: true 
          },
          order: [['last_health_check', 'DESC']],
          attributes: [
            'cpu_usage_percent',
            'memory_usage_percent', 
            'disk_io_percent',
            'storage_used_gb',
            'storage_total_gb',
            'bandwidth_in_mbps',
            'bandwidth_out_mbps',
            'packets_sent',
            'packets_received',
            'connection_status',
            'recording_status',
            'health_score',
            'temperature_celsius',
            'fan_speed_rpm',
            'power_consumption_watts',
            'last_health_check'
          ]
        }).catch(() => null);
        
        // Calculate storage percentage
        const storageUsed = healthMetrics?.storage_used_gb || 0;
        const storageTotal = healthMetrics?.storage_total_gb || 0;
        const storagePercent = storageTotal > 0 ? Math.round((storageUsed / storageTotal) * 100) : 0;

        return {
          id: nvr.id,
          name: nvr.device_name,
          location: nvr.branch?.name || 'Unknown',
          region: nvr.branch?.region?.name || 'Unknown',
          ipAddress: nvr.ip_address,
          status: nvr.status || 'offline',
          uptime: parseFloat(nvr.uptime_percent) || 0,
          firmware: nvr.securos_version || 'Unknown',
          cameras: nvr.max_cameras || 16,
          camerasOnline: nvr.current_cameras || 0,
          storage: {
            percent: storagePercent,
            used: `${storageUsed.toFixed(1)} GB`,
            total: `${storageTotal.toFixed(1)} GB`
          },
          lastSeen: nvr.last_seen ? new Date(nvr.last_seen).toISOString() : null,
          branch: {
            id: nvr.branch_id,
            name: nvr.branch?.name || 'Unknown'
          },
          // Additional fields for detailed view
          processor: nvr.processor,
          ram: nvr.ram,
          device_id: nvr.device_id,
          product_id: nvr.product_id,
          system_type: nvr.system_type,
          installation_date: nvr.installation_date,
          warranty_expiry: nvr.warranty_expiry,
          previous_maintenance_date: nvr.previous_maintenance_date,
          maintenance_period_days: nvr.maintenance_period_days,
          next_maintenance_date: nvr.next_maintenance_date,
          // Health metrics data
          healthMetrics: healthMetrics ? {
            cpuUsage: parseFloat(healthMetrics.cpu_usage_percent),
            memoryUsage: parseFloat(healthMetrics.memory_usage_percent),
            diskIO: parseFloat(healthMetrics.disk_io_percent),
            storageUsed: parseFloat(healthMetrics.storage_used_gb),
            storageTotal: parseFloat(healthMetrics.storage_total_gb),
            bandwidthIn: parseFloat(healthMetrics.bandwidth_in_mbps),
            bandwidthOut: parseFloat(healthMetrics.bandwidth_out_mbps),
            packetsSent: parseInt(healthMetrics.packets_sent),
            packetsReceived: parseInt(healthMetrics.packets_received),
            connectionStatus: healthMetrics.connection_status,
            recordingStatus: healthMetrics.recording_status,
            healthScore: parseInt(healthMetrics.health_score),
            temperature: parseFloat(healthMetrics.temperature_celsius),
            fanSpeed: parseInt(healthMetrics.fan_speed_rpm),
            powerConsumption: parseFloat(healthMetrics.power_consumption_watts),
            lastHealthCheck: healthMetrics.last_health_check
          } : null
        };
      })) : [];

      // Calculate statistics
      const summary = transformedNVRs.length > 0 ? {
        total: transformedNVRs.length,
        online: transformedNVRs.filter(n => n.status === 'online').length,
        offline: transformedNVRs.filter(n => n.status === 'offline').length,
        warning: transformedNVRs.filter(n => n.status === 'warning').length
      } : (MOCK_DATA.nvrs.summary || { total: 0, online: 0, offline: 0, warning: 0 });

      // Use database data if available, otherwise use mock data
      const nvrList = transformedNVRs.length > 0 ? transformedNVRs : MOCK_DATA.nvrs.nvrs || [];

      res.render('nvr-management', {
        title: 'NVR Management',
        currentPage: 'nvr-management',
        nvrs: nvrList,
        summary: summary
      });
    } catch (error) {
      console.error('Error loading NVRs:', error);
      // Fallback to mock data
      res.render('nvr-management', {
        title: 'NVR Management',
        currentPage: 'nvr-management',
        nvrs: MOCK_DATA.nvrs.nvrs || [],
        summary: MOCK_DATA.nvrs.summary || { total: 0, online: 0, offline: 0, warning: 0 }
      });
    }
  }

  // POST /api/nvrs - Create new NVR
  async createNVR(req, res) {
    try {
      const {
        device_name,
        ip_address,
        branch_id,
        status = 'offline',
        processor,
        ram,
        device_id,
        product_id,
        system_type,
        securos_version,
        max_cameras = 16,
        current_cameras = 0,
        installation_date,
        warranty_expiry,
        previous_maintenance_date,
        maintenance_period_days = 90,
        next_maintenance_date,
        uptime_percent = 0.00
      } = req.body;

      // Validate required fields
      if (!device_name || !ip_address || !branch_id) {
        return res.status(400).json({
          success: false,
          message: 'Device name, IP address, and branch are required'
        });
      }

      // Check if device name already exists
      const existingNVR = await NVR.findOne({
        where: { device_name }
      });

      if (existingNVR) {
        return res.status(400).json({
          success: false,
          message: 'A NVR with this device name already exists'
        });
      }

      // Check if IP address already exists
      const existingIP = await NVR.findOne({
        where: { ip_address }
      });

      if (existingIP) {
        return res.status(400).json({
          success: false,
          message: 'A NVR with this IP address already exists'
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

      // Create the NVR
      const newNVR = await NVR.create({
        device_name,
        ip_address,
        branch_id,
        status,
        processor,
        ram,
        device_id,
        product_id,
        system_type,
        securos_version,
        max_cameras,
        current_cameras,
        installation_date: installation_date || null,
        warranty_expiry: warranty_expiry || null,
        previous_maintenance_date: previous_maintenance_date || null,
        maintenance_period_days,
        next_maintenance_date: next_maintenance_date || null,
        uptime_percent,
        is_active: true
      });

      // Fetch the created NVR with branch information
      const createdNVR = await NVR.findByPk(newNVR.id, {
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }]
      });

      res.status(201).json({
        success: true,
        message: 'NVR created successfully',
        data: {
          id: createdNVR.id,
          device_name: createdNVR.device_name,
          ip_address: createdNVR.ip_address,
          status: createdNVR.status,
          branch: createdNVR.branch?.name || 'Unknown',
          max_cameras: createdNVR.max_cameras,
          current_cameras: createdNVR.current_cameras,
          uptime_percent: createdNVR.uptime_percent
        }
      });

    } catch (error) {
      console.error('Error creating NVR:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating NVR'
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
}

module.exports = new NVRController();
