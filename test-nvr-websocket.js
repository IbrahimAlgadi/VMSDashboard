/**
 * Test script for NVR WebSocket connection
 * 
 * This simulates an NVR connecting to the WebSocket server
 * Usage: node test-nvr-websocket.js <hostname>
 * Example: node test-nvr-websocket.js DESKTOP-T7MNQIA
 */

const WebSocket = require('ws');

const HOSTNAME = process.argv[2] || 'DESKTOP-T7MNQIA';
const WS_URL = `ws://localhost:3000/ws`;

console.log(`🔌 Connecting to ${WS_URL} as NVR: ${HOSTNAME}`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
  
  // Mock systemStatus with camera data
  const systemStatus = {
    status: 'online',
    cameras: [
      { name: 'CAM-001', ip_address: '192.168.0.101', status: 'online' },
      { name: 'CAM-002', ip_address: '192.168.0.102', status: 'online' },
      { name: 'CAM-003', ip_address: '192.168.0.103', status: 'offline' }
    ]
  };
  
  // Send authentication message with systemStatus
  const authMessage = {
    type: 'auth',
    hostname: HOSTNAME,
    systemStatus: systemStatus
  };
  
  console.log(`📤 Sending auth:`, authMessage);
  ws.send(JSON.stringify(authMessage));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 Received:', message);
    
    if (message.type === 'auth_ok') {
      console.log(`✅ Authenticated as ${message.hostname} (${message.device_name})`);
      console.log('💓 Starting heartbeat...');
      
      // Start sending heartbeat every 10 seconds with systemStatus
      setInterval(() => {
        const systemStatus = {
          status: 'online',
          cameras: [
            { name: 'CAM-001', ip_address: '192.168.0.101', status: 'online' },
            { name: 'CAM-002', ip_address: '192.168.0.102', status: 'online' },
            { name: 'CAM-003', ip_address: '192.168.0.103', status: 'offline' }
          ]
        };
        
        const heartbeat = {
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          systemStatus: systemStatus
        };
        ws.send(JSON.stringify(heartbeat));
        console.log('💓 Heartbeat sent with systemStatus');
      }, 10000);
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error.message);
  }
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Disconnected (code: ${code}, reason: ${reason.toString()})`);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 Closing connection...');
  ws.close();
  process.exit(0);
});

console.log('💡 Press Ctrl+C to exit');

