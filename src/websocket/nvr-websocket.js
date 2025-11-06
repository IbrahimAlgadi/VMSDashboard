const { WebSocketServer } = require('ws');
const { NVR, Camera } = require('../models');

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
    this.wss = null;
  }

  /**
   * Initialize and attach WebSocket server to HTTP server
   */
  attach(httpServer) {
    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start heartbeat interval to detect stale connections
    this.startHeartbeatChecker();

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

      // Mark NVR as online
      await this.markNVROnline(hostname);

      // Process systemStatus if provided to update individual cameras
      if (systemStatus && systemStatus.cameras) {
        await this.processSystemStatus(hostname, systemStatus);
      } else {
        // Fallback: mark all cameras online if no systemStatus
        await this.markAllCamerasOnline(nvr.id);
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
        attributes: ['id', 'hostname', 'device_name']
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
          // Find camera by name and NVR ID
          const camera = await Camera.findOne({
            where: { 
              name: cameraStatus.name,
              nvr_id: nvr.id
            },
            attributes: ['id', 'name', 'status']
          });

          if (camera && camera.status !== cameraStatus.status) {
            const oldStatus = camera.status;
            await camera.update({ status: cameraStatus.status });
            updatedCount++;
            console.log(`📹 Camera ${camera.name}: ${oldStatus} → ${cameraStatus.status}`);
          }
        } catch (error) {
          console.error(`❌ Error updating camera ${cameraStatus.name}:`, error.message);
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} cameras based on NVR systemStatus`);
      }

      // Broadcast status update to dashboard clients
      this.broadcastToDashboard({
        type: 'nvr_status_update',
        hostname: nvr.hostname,
        device_name: nvr.device_name,
        nvr_id: nvr.id,
        cameras_updated: updatedCount,
        timestamp: new Date().toISOString()
      });

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

      // Clean up connection mapping
      this.nvrConnections.delete(hostname);
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
        attributes: ['id', 'hostname', 'device_name', 'status']
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

      // Broadcast status update to dashboard clients
      this.broadcastToDashboard({
        type: 'nvr_offline',
        hostname: nvr.hostname,
        device_name: nvr.device_name,
        nvr_id: nvr.id,
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
   * Start heartbeat checker to detect stale connections
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
   * Stop heartbeat checker
   */
  stopHeartbeatChecker() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
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

