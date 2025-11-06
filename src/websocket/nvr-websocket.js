const { WebSocketServer } = require('ws');
const { Op } = require('sequelize');
const { NVR, Camera } = require('../models');
const { updateNVRStatus } = require('../utils/validation');

/**
 * WebSocket server for NVR heartbeat and real-time status updates
 * 
 * Handles:
 * - NVR authentication via hostname
 * - Heartbeat from NVR devices
 * - Automatic offline detection on disconnect
 * - Status synchronization between NVR and cameras
 * - Real-time status broadcasting to dashboard clients
 */
class NVRWebSocketServer {
  constructor() {
    this.nvrConnections = new Map(); // hostname → WebSocket
    this.dashboardClients = new Set(); // WebSocket clients for dashboard UI
    this.heartbeatInterval = null;
    this.heartbeatTimeoutInterval = null;
    this.nvrLastHeartbeat = new Map(); // hostname → last heartbeat timestamp
    this.heartbeatTimeoutMs = 5000; // 15 seconds timeout (balanced: detects in ~15-20s)
    this.wss = null;
  }

  /**
   * Initialize and attach WebSocket server to HTTP server
   */
  async attach(httpServer) {
    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Initialize all NVRs and cameras as offline on startup
    await this.initializeAllNVRsAsOffline();

    // Start heartbeat interval to detect stale connections
    this.startHeartbeatChecker();
    
    // Start heartbeat timeout checker
    this.startHeartbeatTimeoutChecker();

    console.log('🔌 NVR WebSocket server ready on /ws');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    console.log('🔌 New WebSocket connection:', req.socket.remoteAddress);

    ws.isAlive = true;

    // Handle incoming messages
    ws.on('message', async (data) => {
      this.handleMessage(ws, data);
    });

    // Handle pong response
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle connection close
    ws.on('close', async () => {
      await this.handleDisconnect(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  async handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());

      console.log('🔌 Message received:', message);

      // NVR authentication
      if (message.type === 'auth' && message.hostname) {
        console.log('🔌 NVR authentication received from:', message.hostname);
        await this.handleNVRAuth(ws, message.hostname, message.systemStatus);
        return;
      }

      // Heartbeat from authenticated NVR
      if (message.type === 'heartbeat' && ws.hostname) {
        console.log('💓 Heartbeat received from:', ws.hostname);
        // Update heartbeat timestamp
        this.nvrLastHeartbeat.set(ws.hostname, Date.now());
        await this.updateLastSeen(ws.hostname);
        // Process systemStatus if provided
        if (message.systemStatus) {
          await this.processSystemStatus(ws.hostname, message.systemStatus);
        }
        return;
      }

      // Dashboard client connection (for broadcasting updates)
      if (message.type === 'dashboard') {
        this.dashboardClients.add(ws);
        ws.send(JSON.stringify({ 
          type: 'dashboard_ok',
          message: 'Dashboard connected to WebSocket server'
        }));
        console.log('📊 Dashboard client connected');
        return;
      }

      console.log('⚠️ Unknown message type:', message.type);

    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error.message);
    }
  }

  /**
   * Handle NVR authentication
   */
  async handleNVRAuth(ws, hostname, systemStatus = null) {
    try {
      // Find NVR in database by hostname
      const nvr = await NVR.findOne({ 
        where: { hostname },
        attributes: ['id', 'hostname', 'device_name', 'ip_address']
      });

      if (!nvr) {
        console.log(`❌ Authentication failed: unknown hostname ${hostname}`);
        ws.close(1008, 'Invalid hostname');
        return;
      }

      // Store connection with hostname mapping
      ws.hostname = hostname;
      ws.isNVR = true;
      this.nvrConnections.set(hostname, ws);
      
      // Initialize heartbeat timestamp
      this.nvrLastHeartbeat.set(hostname, Date.now());

      // Mark NVR as online (but don't broadcast yet - we'll recalculate after cameras are processed)
      await this.markNVROnline(hostname);

      // Process systemStatus if provided to update individual cameras
      if (systemStatus && systemStatus.cameras) {
        await this.processSystemStatus(hostname, systemStatus);
        // processSystemStatus now recalculates NVR status after updating cameras
      } else {
        // Fallback: mark all cameras online if no systemStatus
        await this.markAllCamerasOnline(nvr.id);
        // markAllCamerasOnline now recalculates NVR status
      }
      
      // Final NVR status recalculation to ensure it's correct after all camera updates
      // Force recalculation since NVR just reconnected (was offline, now online)
      // This ensures status is calculated based on current camera states
      await updateNVRStatus(NVR, Camera, nvr.id, true); // forceRecalculate = true
      
      // Fetch final NVR status and broadcast (with branch_id for map updates)
      const finalNVR = await NVR.findOne({
        where: { id: nvr.id },
        attributes: ['id', 'hostname', 'device_name', 'status', 'branch_id']
      });
      
      if (finalNVR) {
        this.broadcastToDashboard({
          type: 'nvr_status_update',
          hostname: finalNVR.hostname,
          device_name: finalNVR.device_name,
          nvr_id: finalNVR.id,
          branch_id: finalNVR.branch_id, // Include branch_id for map updates
          status: finalNVR.status,
          timestamp: new Date().toISOString()
        });
      }

      // Send authentication confirmation
      ws.send(JSON.stringify({ 
        type: 'auth_ok', 
        hostname: nvr.hostname,
        device_name: nvr.device_name
      }));

      console.log(`✅ NVR authenticated: ${nvr.device_name} (${hostname})`);

    } catch (error) {
      console.error('❌ Error during NVR authentication:', error.message);
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Update last_seen timestamp for NVR
   */
  async updateLastSeen(hostname) {
    try {
      const nvr = await NVR.findOne({ where: { hostname } });
      if (nvr) {
        await nvr.update({ last_seen: new Date() });
      }
    } catch (error) {
      console.error(`❌ Error updating last_seen for ${hostname}:`, error.message);
    }
  }

  /**
   * Mark NVR as online
   */
  async markNVROnline(hostname) {
    try {
      const nvr = await NVR.findOne({ 
        where: { hostname },
        attributes: ['id', 'hostname', 'device_name', 'status', 'branch_id']
      });

      if (!nvr) {
        console.log(`⚠️ NVR not found for hostname: ${hostname}`);
        return;
      }

      // Update NVR status if not already online
      if (nvr.status !== 'online') {
        await nvr.update({ 
          status: 'online', 
          last_seen: new Date() 
        });
        console.log(`✅ NVR marked online: ${nvr.device_name}`);
      } else {
        // Still update last_seen even if already online
        await nvr.update({ last_seen: new Date() });
      }
      
      // Note: We don't broadcast here because status will be recalculated
      // based on camera statuses after processing systemStatus

    } catch (error) {
      console.error(`❌ Error marking NVR online:`, error.message);
    }
  }

  /**
   * Mark all cameras under NVR as online (fallback)
   */
  async markAllCamerasOnline(nvrId) {
    try {
      const camerasUpdated = await Camera.update(
        { status: 'online' },
        { 
          where: { nvr_id: nvrId, status: 'offline' },
          returning: false
        }
      );

      if (camerasUpdated[0] > 0) {
        console.log(`✅ Updated ${camerasUpdated[0]} cameras to online`);
        
        // Recalculate NVR status after marking cameras online
        await updateNVRStatus(NVR, Camera, nvrId);
      }
    } catch (error) {
      console.error(`❌ Error marking all cameras online:`, error.message);
    }
  }

  /**
   * Process systemStatus from NVR to update individual camera status
   */
  async processSystemStatus(hostname, systemStatus) {
    try {
      const nvr = await NVR.findOne({ 
        where: { hostname },
        attributes: ['id', 'hostname', 'device_name', 'branch_id']
      });

      if (!nvr) {
        console.log(`⚠️ NVR not found for hostname: ${hostname}`);
        return;
      }

      if (!systemStatus.cameras || !Array.isArray(systemStatus.cameras)) {
        console.log(`⚠️ Invalid systemStatus format for ${hostname}`);
        return;
      }

      let updatedCount = 0;

      // Update each camera individually based on NVR's reported status
      for (const cameraStatus of systemStatus.cameras) {
        try {
          console.log(`🔍 Looking for camera: name="${cameraStatus.name}", nvr_id=${nvr.id}, status="${cameraStatus.status}"`);
          
          // Find camera by name and NVR ID (include branch_id for map updates)
          const camera = await Camera.findOne({
            where: { 
              name: cameraStatus.name,
              nvr_id: nvr.id
            },
            attributes: ['id', 'name', 'status', 'branch_id']
          });

          if (!camera) {
            console.log(`⚠️ Camera not found: name="${cameraStatus.name}", nvr_id=${nvr.id}`);
            continue;
          }

          console.log(`📹 Found camera: id=${camera.id}, current_status="${camera.status}", new_status="${cameraStatus.status}"`);

          const oldStatus = camera.status;
          const statusChanged = camera.status !== cameraStatus.status;

          if (statusChanged) {
            await camera.update({ status: cameraStatus.status });
            updatedCount++;
            console.log(`✅ Camera ${camera.name} (ID: ${camera.id}): ${oldStatus} → ${cameraStatus.status}`);
          } else {
            console.log(`ℹ️ Camera ${camera.name} status unchanged: ${camera.status}`);
          }

          // Always broadcast camera status update (even if unchanged) to keep frontend synchronized
          // This ensures frontend receives periodic updates for monitoring and state consistency
          const broadcastMessage = {
            type: 'camera_status_update',
            camera_id: camera.id,
            camera_name: camera.name,
            nvr_id: nvr.id,
            branch_id: camera.branch_id || nvr.branch_id, // Include branch_id for map updates
            old_status: oldStatus,
            new_status: cameraStatus.status,
            timestamp: new Date().toISOString()
          };
          
          if (statusChanged) {
            console.log(`📤 Broadcasting camera status update (changed):`, broadcastMessage);
          } else {
            console.log(`📤 Broadcasting camera status update (unchanged, sync):`, broadcastMessage);
          }
          this.broadcastToDashboard(broadcastMessage);
        } catch (error) {
          console.error(`❌ Error updating camera ${cameraStatus.name}:`, error.message);
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} cameras based on NVR systemStatus`);
      }
      
      // Always recalculate NVR status based on current camera statuses
      // (even if no cameras changed, status might have changed from previous heartbeat)
      // Force recalculation to ensure status is always up-to-date after processing systemStatus
      const nvrStatusUpdated = await updateNVRStatus(NVR, Camera, nvr.id, true); // forceRecalculate = true
      
      // Always fetch and broadcast current NVR status after processing systemStatus
      // This ensures frontend gets updates even if status didn't change (for consistency)
      const updatedNVR = await NVR.findOne({
        where: { id: nvr.id },
        attributes: ['id', 'hostname', 'device_name', 'status', 'branch_id']
      });
      
      if (updatedNVR) {
        if (nvrStatusUpdated) {
          console.log(`📡 NVR ${updatedNVR.device_name} status recalculated: ${updatedNVR.status}`);
        } else {
          console.log(`📡 NVR ${updatedNVR.device_name} status confirmed: ${updatedNVR.status}`);
        }

        // Always broadcast NVR status update after processing systemStatus
        // This ensures frontend stays in sync, especially when cameras change status
        this.broadcastToDashboard({
          type: 'nvr_status_update',
          hostname: updatedNVR.hostname,
          device_name: updatedNVR.device_name,
          nvr_id: updatedNVR.id,
          branch_id: updatedNVR.branch_id, // Include branch_id for map updates
          status: updatedNVR.status,
          cameras_updated: updatedCount,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error(`❌ Error processing systemStatus:`, error.message);
    }
  }

  /**
   * Mark NVR and all its cameras as online (legacy - kept for backwards compatibility)
   */
  async markNVRAndCamerasOnline(hostname) {
    try {
      const nvr = await NVR.findOne({ 
        where: { hostname },
        attributes: ['id', 'hostname', 'device_name', 'status']
      });

      if (!nvr) {
        console.log(`⚠️ NVR not found for hostname: ${hostname}`);
        return;
      }

      // Update NVR status if not already online
      if (nvr.status !== 'online') {
        await nvr.update({ 
          status: 'online', 
          last_seen: new Date() 
        });
        console.log(`✅ NVR marked online: ${nvr.device_name}`);
      } else {
        // Still update last_seen even if already online
        await nvr.update({ last_seen: new Date() });
      }

      // Update all cameras under this NVR
      const camerasUpdated = await Camera.update(
        { status: 'online' },
        { 
          where: { nvr_id: nvr.id, status: 'offline' },
          returning: false
        }
      );

      if (camerasUpdated[0] > 0) {
        console.log(`✅ Updated ${camerasUpdated[0]} cameras to online for NVR ${nvr.device_name}`);
      }

      // Broadcast status update to dashboard clients
      this.broadcastToDashboard({
        type: 'nvr_online',
        hostname: nvr.hostname,
        device_name: nvr.device_name,
        nvr_id: nvr.id,
        cameras_updated: camerasUpdated[0],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Error marking NVR and cameras online:`, error.message);
    }
  }

  /**
   * Handle NVR disconnection
   */
  async handleDisconnect(ws) {
    if (ws.hostname) {
      const hostname = ws.hostname;
      console.log(`🔌 NVR disconnected: ${hostname}`);

      // Mark NVR and all its cameras as offline
      await this.markNVRAndCamerasOffline(hostname);

      // Clean up connection mapping and heartbeat tracking
      this.nvrConnections.delete(hostname);
      this.nvrLastHeartbeat.delete(hostname);
    } else if (this.dashboardClients.has(ws)) {
      // Dashboard client disconnected
      this.dashboardClients.delete(ws);
      console.log('📊 Dashboard client disconnected');
    }
  }

  /**
   * Mark NVR and all its cameras as offline
   */
  async markNVRAndCamerasOffline(hostname) {
    try {
      const nvr = await NVR.findOne({ 
        where: { hostname },
        attributes: ['id', 'hostname', 'device_name', 'status', 'branch_id']
      });

      if (!nvr) {
        console.log(`⚠️ NVR not found for hostname: ${hostname}`);
        return;
      }

      // Update NVR status
      if (nvr.status !== 'offline') {
        await nvr.update({ 
          status: 'offline',
          last_seen: new Date()
        });
        console.log(`❌ NVR marked offline: ${nvr.device_name}`);
      }

      // Update all cameras under this NVR
      const camerasUpdated = await Camera.update(
        { status: 'offline' },
        { 
          where: { nvr_id: nvr.id, status: 'online' },
          returning: false
        }
      );

      if (camerasUpdated[0] > 0) {
        console.log(`❌ Updated ${camerasUpdated[0]} cameras to offline for NVR ${nvr.device_name}`);
      }

      // NVR status is already set to offline above
      // Don't recalculate - when NVR hardware is disconnected, it should remain 'offline'
      // regardless of camera statuses (updateNVRStatus would change it to 'warning')
      
      // Fetch updated NVR to get final status (with branch_id for map updates)
      const updatedNVR = await NVR.findOne({
        where: { id: nvr.id },
        attributes: ['id', 'hostname', 'device_name', 'status', 'branch_id']
      });

      // Broadcast status update to dashboard clients
      this.broadcastToDashboard({
        type: 'nvr_offline',
        hostname: updatedNVR?.hostname || nvr.hostname,
        device_name: updatedNVR?.device_name || nvr.device_name,
        nvr_id: nvr.id,
        branch_id: updatedNVR?.branch_id || nvr.branch_id, // Include branch_id for map updates
        status: updatedNVR?.status || 'offline',
        cameras_updated: camerasUpdated[0],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Error marking NVR and cameras offline:`, error.message);
    }
  }

  /**
   * Broadcast message to all dashboard clients
   */
  broadcastToDashboard(message) {
    if (this.dashboardClients.size === 0) {
      console.log('⚠️ No dashboard clients connected to broadcast:', message.type);
      return;
    }

    const data = JSON.stringify(message);
    let sentCount = 0;

    this.dashboardClients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(data);
          sentCount++;
        } catch (error) {
          console.error('Error sending to dashboard client:', error.message);
        }
      } else {
        // Remove closed connections
        this.dashboardClients.delete(client);
      }
    });

    if (sentCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`📡 Broadcasted to ${sentCount} dashboard clients: ${message.type}`);
    }
  }

  /**
   * Initialize all NVRs and cameras as offline on server startup
   */
  async initializeAllNVRsAsOffline() {
    try {
      console.log('🔄 Initializing all NVRs and cameras as offline...');
      
      // Find all active NVRs
      const nvrs = await NVR.findAll({
        where: { is_active: true },
        attributes: ['id', 'hostname', 'device_name', 'status']
      });

      let nvrsUpdated = 0;
      let camerasUpdated = 0;

      for (const nvr of nvrs) {
        // Mark NVR as offline if not already
        if (nvr.status !== 'offline') {
          await nvr.update({ 
            status: 'offline',
            last_seen: null // Clear last_seen on initialization
          });
          nvrsUpdated++;
        }

        // Mark all cameras under this NVR as offline
        const camerasResult = await Camera.update(
          { status: 'offline' },
          { 
            where: { 
              nvr_id: nvr.id,
              status: { [Op.ne]: 'offline' } // Only update if not already offline
            },
            returning: false
          }
        );
        
        camerasUpdated += camerasResult[0] || 0;
      }

      console.log(`✅ Initialization complete: ${nvrs.length} NVRs checked, ${nvrsUpdated} NVRs marked offline, ${camerasUpdated} cameras marked offline`);
      
    } catch (error) {
      console.error('❌ Error initializing NVRs as offline:', error.message);
    }
  }

  /**
   * Start heartbeat checker to detect stale connections (ping/pong)
   */
  startHeartbeatChecker() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isNVR && !ws.isAlive) {
          // Connection is dead, terminate it
          console.log(`💀 Terminating dead NVR connection: ${ws.hostname}`);
          this.dashboardClients.delete(ws);
          return ws.terminate();
        }

        // Ping all NVR connections
        if (ws.isNVR && ws.isAlive) {
          ws.isAlive = false;
          ws.ping();
        }
      });
    }, 30000); // Check every 30 seconds

    console.log('💓 Heartbeat checker started (30s interval)');
  }

  /**
   * Start heartbeat timeout checker to detect NVRs that stopped sending heartbeats
   */
  startHeartbeatTimeoutChecker() {
    this.heartbeatTimeoutInterval = setInterval(async () => {
      const now = Date.now();
      const timeoutNVRs = [];

      // Check all connected NVRs for heartbeat timeout
      this.nvrLastHeartbeat.forEach((lastHeartbeat, hostname) => {
        const timeSinceLastHeartbeat = now - lastHeartbeat;
        
        if (timeSinceLastHeartbeat > this.heartbeatTimeoutMs) {
          timeoutNVRs.push(hostname);
        }
      });

      // Handle timeout for each NVR
      for (const hostname of timeoutNVRs) {
        console.log(`⏱️ Heartbeat timeout detected for NVR: ${hostname} (no heartbeat for ${Math.round((now - this.nvrLastHeartbeat.get(hostname)) / 1000)}s)`);
        
        const ws = this.nvrConnections.get(hostname);
        if (ws && ws.readyState === 1) { // WebSocket.OPEN
          // Mark NVR and cameras as offline
          await this.markNVRAndCamerasOffline(hostname);
          
          // Close the connection
          ws.close(1000, 'Heartbeat timeout');
          
          // Clean up
          this.nvrConnections.delete(hostname);
          this.nvrLastHeartbeat.delete(hostname);
        }
      }
    }, 10000); // Check every 10 seconds (balanced: faster detection)

    console.log(`⏱️ Heartbeat timeout checker started (10s interval, ${this.heartbeatTimeoutMs / 1000}s timeout)`);
  }

  /**
   * Stop heartbeat checker
   */
  stopHeartbeatChecker() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeoutInterval) {
      clearInterval(this.heartbeatTimeoutInterval);
      this.heartbeatTimeoutInterval = null;
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      nvr_connections: this.nvrConnections.size,
      dashboard_clients: this.dashboardClients.size,
      nvr_hostnames: Array.from(this.nvrConnections.keys())
    };
  }

  /**
   * Close all connections and cleanup
   */
  close() {
    this.stopHeartbeatChecker();
    
    // Close all NVR connections
    this.nvrConnections.forEach((ws) => {
      ws.close();
    });
    this.nvrConnections.clear();
    
    // Clear heartbeat tracking
    this.nvrLastHeartbeat.clear();

    // Close all dashboard connections
    this.dashboardClients.forEach((ws) => {
      ws.close();
    });
    this.dashboardClients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    console.log('🔌 NVR WebSocket server closed');
  }
}

module.exports = new NVRWebSocketServer();

