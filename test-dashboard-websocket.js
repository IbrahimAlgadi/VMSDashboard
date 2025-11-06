/**
 * Test script for Dashboard WebSocket connection
 * 
 * This simulates a dashboard client connecting to receive real-time updates
 * Usage: node test-dashboard-websocket.js
 */

const WebSocket = require('ws');

const WS_URL = `ws://localhost:3000/ws`;

console.log(`🔌 Connecting to ${WS_URL} as Dashboard client`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
  
  // Send dashboard registration message
  const dashboardMessage = {
    type: 'dashboard'
  };
  
  console.log(`📤 Registering as dashboard client...`);
  ws.send(JSON.stringify(dashboardMessage));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'dashboard_ok') {
      console.log('✅ Dashboard client registered');
      console.log('📡 Listening for NVR status updates...\n');
      return;
    }
    
    // Handle NVR status updates
    console.log('📥 NVR Status Update:');
    console.log(`   Type: ${message.type}`);
    console.log(`   Hostname: ${message.hostname}`);
    console.log(`   Device: ${message.device_name}`);
    console.log(`   Cameras Updated: ${message.cameras_updated}`);
    console.log(`   Timestamp: ${message.timestamp}\n`);
    
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

