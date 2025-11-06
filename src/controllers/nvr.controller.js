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
        const storageUsed = parseFloat(healthMetrics?.storage_used_gb) || 0;
        const storageTotal = parseFloat(healthMetrics?.storage_total_gb) || 0;
        const storagePercent = storageTotal > 0 ? Math.round((storageUsed / storageTotal) * 100) : 0;

        return {
          id: nvr.id,
          name: nvr.device_name,
          hostname: nvr.hostname, // Include hostname for WebSocket matching
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

  // GET /api/nvrs - Get all NVRs
  async getAllNVRs(req, res) {
    try {
      const { branch_id, status, is_active } = req.query;

      const where = {};
      if (branch_id) where.branch_id = branch_id;
      if (status) where.status = status;
      if (is_active !== undefined) where.is_active = is_active === 'true';

      const nvrs = await NVR.findAll({
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
          include: [{
            model: Region,
            as: 'region',
            attributes: ['id', 'name', 'code']
          }]
        }],
        where,
        order: [['device_name', 'ASC']]
      });

      res.json({
        success: true,
        data: nvrs
      });

    } catch (error) {
      console.error('Error fetching NVRs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching NVRs'
      });
    }
  }

  // GET /api/nvrs/:id - Get NVR by ID
  async getNVRById(req, res) {
    try {
      const { id } = req.params;

      const nvr = await NVR.findByPk(id, {
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'branch_code'],
          include: [{
            model: Region,
            as: 'region',
            attributes: ['id', 'name', 'code']
          }]
        }]
      });

      if (!nvr) {
        return res.status(404).json({
          success: false,
          message: `NVR with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        data: nvr
      });

    } catch (error) {
      console.error('Error fetching NVR:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching NVR'
      });
    }
  }

  // PATCH /api/nvrs/:name - Update NVR by name
  async updateNVRByName(req, res) {
    try {
      const { name } = req.params;
      const updateData = req.body;

      // Find NVR by device_name
      const nvr = await NVR.findOne({
        where: { device_name: name }
      });

      if (!nvr) {
        return res.status(404).json({
          success: false,
          message: `NVR with name "${name}" not found`
        });
      }

      // Validate status if provided
      if (updateData.status && !['online', 'offline', 'warning', 'error'].includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: online, offline, warning, error'
        });
      }

      // Update the NVR
      await nvr.update(updateData);

      res.json({
        success: true,
        message: 'NVR updated successfully',
        data: {
          id: nvr.id,
          device_name: nvr.device_name,
          status: nvr.status,
          uptime_percent: nvr.uptime_percent
        }
      });

    } catch (error) {
      console.error('Error updating NVR:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating NVR'
      });
    }
  }

  // PATCH /api/nvrs/hostname/:nvr_name - Update NVR by hostname
  async updateNVRByHostname(req, res) {
    try {
      const { nvr_name } = req.params;
      const updateData = req.body;

      // Find NVR by hostname
      const nvr = await NVR.findOne({
        where: { hostname: nvr_name }
      });

      if (!nvr) {
        return res.status(404).json({
          success: false,
          message: `NVR with hostname "${nvr_name}" not found`
        });
      }

      // Validate status if provided
      if (updateData.status && !['online', 'offline', 'warning', 'error'].includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: online, offline, warning, error'
        });
      }

      // Check if device_name is being updated and already exists
      if (updateData.device_name && updateData.device_name !== nvr.device_name) {
        const existingNVR = await NVR.findOne({
          where: { device_name: updateData.device_name }
        });

        if (existingNVR) {
          return res.status(400).json({
            success: false,
            message: 'A NVR with this device name already exists'
          });
        }
      }

      // Check if hostname is being updated and already exists
      if (updateData.hostname && updateData.hostname !== nvr.hostname) {
        const existingHostname = await NVR.findOne({
          where: { hostname: updateData.hostname }
        });

        if (existingHostname) {
          return res.status(400).json({
            success: false,
            message: 'A NVR with this hostname already exists'
          });
        }
      }

      // Check if IP address is being updated and already exists
      if (updateData.ip_address && updateData.ip_address !== nvr.ip_address) {
        const existingIP = await NVR.findOne({
          where: { ip_address: updateData.ip_address }
        });

        if (existingIP) {
          return res.status(400).json({
            success: false,
            message: 'A NVR with this IP address already exists'
          });
        }
      }

      // Verify branch exists if branch_id is being updated
      if (updateData.branch_id && updateData.branch_id !== nvr.branch_id) {
        const branch = await Branch.findByPk(updateData.branch_id);
        if (!branch) {
          return res.status(400).json({
            success: false,
            message: 'Selected branch does not exist'
          });
        }
      }

      // Update the NVR
      await nvr.update(updateData);

      // Fetch updated NVR with branch info
      const updatedNVR = await NVR.findByPk(nvr.id, {
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }]
      });

      res.json({
        success: true,
        message: 'NVR updated successfully',
        data: updatedNVR
      });

    } catch (error) {
      console.error('Error updating NVR:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating NVR'
      });
    }
  }

  // PATCH /api/nvrs/:id - Update NVR by ID
  async updateNVR(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const nvr = await NVR.findByPk(id);

      if (!nvr) {
        return res.status(404).json({
          success: false,
          message: `NVR with ID ${id} not found`
        });
      }

      // Validate status if provided
      if (updateData.status && !['online', 'offline', 'warning', 'error'].includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: online, offline, warning, error'
        });
      }

      // Check if device_name is being updated and already exists
      if (updateData.device_name && updateData.device_name !== nvr.device_name) {
        const existingNVR = await NVR.findOne({
          where: { device_name: updateData.device_name }
        });

        if (existingNVR) {
          return res.status(400).json({
            success: false,
            message: 'A NVR with this device name already exists'
          });
        }
      }

      // Check if IP address is being updated and already exists
      if (updateData.ip_address && updateData.ip_address !== nvr.ip_address) {
        const existingIP = await NVR.findOne({
          where: { ip_address: updateData.ip_address }
        });

        if (existingIP) {
          return res.status(400).json({
            success: false,
            message: 'A NVR with this IP address already exists'
          });
        }
      }

      // Verify branch exists if branch_id is being updated
      if (updateData.branch_id && updateData.branch_id !== nvr.branch_id) {
        const branch = await Branch.findByPk(updateData.branch_id);
        if (!branch) {
          return res.status(400).json({
            success: false,
            message: 'Selected branch does not exist'
          });
        }
      }

      // Update the NVR
      await nvr.update(updateData);

      // Fetch updated NVR with branch info
      const updatedNVR = await NVR.findByPk(id, {
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }]
      });

      res.json({
        success: true,
        message: 'NVR updated successfully',
        data: updatedNVR
      });

    } catch (error) {
      console.error('Error updating NVR:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating NVR'
      });
    }
  }

  // DELETE /api/nvrs/:id - Delete NVR by ID
  async deleteNVR(req, res) {
    try {
      const { id } = req.params;

      const nvr = await NVR.findByPk(id);

      if (!nvr) {
        return res.status(404).json({
          success: false,
          message: `NVR with ID ${id} not found`
        });
      }

      const { hardDelete } = req.query;

      if (hardDelete === 'true') {
        // Hard delete - will cascade delete related cameras
        await nvr.destroy();
        return res.json({
          success: true,
          message: 'NVR deleted successfully'
        });
      } else {
        // Soft delete - set is_active to false
        await nvr.update({ is_active: false });
        return res.json({
          success: true,
          message: 'NVR deactivated successfully',
          data: {
            id: nvr.id,
            device_name: nvr.device_name,
            is_active: false
          }
        });
      }

    } catch (error) {
      console.error('Error deleting NVR:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting NVR'
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

  // POST /api/nvrs/:hostname/metrics - Ingest health metrics from VM/NVR
  async ingestHealthMetrics(req, res) {
    try {
      const { hostname } = req.params;
      const metrics = req.body;

      // Validate required fields
      if (!metrics.storage || !metrics.systemHealth || !metrics.uptime) {
        return res.status(400).json({
          success: false,
          message: 'Missing required metrics fields: storage, systemHealth, uptime'
        });
      }

      // Find NVR by hostname
      let nvr = await NVR.findOne({
        where: { hostname }
      });

      if (!nvr) {
        return res.status(404).json({
          success: false,
          message: `NVR not found for hostname: ${hostname}. Please register the system first.`
        });
      }

      // Calculate health score (0-100)
      const cpuUsage = parseFloat(metrics.systemHealth?.cpuPercent) || 0;
      const memoryUsage = parseFloat(metrics.systemHealth?.memoryPercent) || 0;
      const storageUsage = parseFloat(metrics.storage?.usedPercent) || 0;
      
      let healthScore = 100;
      // Penalize for high resource usage
      if (cpuUsage > 90) healthScore -= 30;
      else if (cpuUsage > 70) healthScore -= 15;
      else if (cpuUsage > 50) healthScore -= 5;
      
      if (memoryUsage > 95) healthScore -= 30;
      else if (memoryUsage > 80) healthScore -= 15;
      else if (memoryUsage > 70) healthScore -= 5;
      
      if (storageUsage > 95) healthScore -= 20;
      else if (storageUsage > 85) healthScore -= 10;
      
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Extract network statistics if provided
      const bandwidthIn = parseFloat(metrics.network?.bandwidthInMbps) || 0;
      const bandwidthOut = parseFloat(metrics.network?.bandwidthOutMbps) || 0;

      // Map incoming payload to database schema
      const healthMetricsData = {
        nvr_id: nvr.id,
        cpu_usage_percent: cpuUsage,
        memory_usage_percent: memoryUsage,
        disk_io_percent: 0, // Not provided in simplified payload
        storage_used_gb: metrics.storage?.usedGB || 0,
        storage_total_gb: metrics.storage?.totalGB || 0,
        bandwidth_in_mbps: bandwidthIn,
        bandwidth_out_mbps: bandwidthOut,
        packets_sent: 0,
        packets_received: 0,
        connection_status: 'connected',
        recording_status: 'recording',
        health_score: Math.round(healthScore),
        last_health_check: metrics.timestamp ? new Date(metrics.timestamp) : new Date(),
        is_active: true
      };

      // Find or create health metrics
      let healthMetrics = await NVRHealthMetrics.findOne({
        where: { nvr_id: nvr.id, is_active: true }
      });

      let created = false;
      if (healthMetrics) {
        await healthMetrics.update(healthMetricsData);
      } else {
        healthMetrics = await NVRHealthMetrics.create(healthMetricsData);
        created = true;
      }

      // Determine NVR status based on health
      let nvrStatus = 'online';
      if (healthScore < 50) {
        nvrStatus = 'error';
      } else if (healthScore < 70 || storageUsage > 90) {
        nvrStatus = 'warning';
      }

      // Update NVR status, last_seen, and uptime
      await nvr.update({
        status: nvrStatus,
        last_seen: new Date(metrics.timestamp || Date.now()),
        uptime_percent: parseFloat(metrics.uptime?.percentOf24h || 0)
      });

      res.json({
        success: true,
        message: created ? 'Health metrics created' : 'Health metrics updated',
        data: {
          nvr_id: nvr.id,
          nvr_name: nvr.device_name,
          health_score: healthMetrics.health_score,
          status: nvrStatus,
          metrics_received: {
            cpu: cpuUsage,
            memory: memoryUsage,
            storage: storageUsage,
            uptime: metrics.uptime?.percentOf24h,
            network: {
              bandwidth_in: bandwidthIn,
              bandwidth_out: bandwidthOut
            }
          },
          timestamp: metrics.timestamp
        }
      });

    } catch (error) {
      console.error('Error ingesting health metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while processing health metrics',
        error: error.message
      });
    }
  }
}

module.exports = new NVRController();
