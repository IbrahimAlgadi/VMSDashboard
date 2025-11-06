# WebSocket Heartbeat System - Quick Setup

## ✅ Implementation Complete

The WebSocket-based heartbeat system for NVR devices has been successfully implemented.

## 🎯 What It Does

- **NVR connects** → Automatically marks NVR + all cameras as **online**
- **NVR disconnects** → Automatically marks NVR + all cameras as **offline**
- **Heartbeat** → Updates `last_seen` timestamp every 10 seconds
- **Dashboard updates** → Real-time status broadcasting to connected clients

## 📁 Files Created

1. **`src/websocket/nvr-websocket.js`** - Main WebSocket server
2. **`test-nvr-websocket.js`** - NVR client simulator
3. **`test-dashboard-websocket.js`** - Dashboard client simulator
4. **`WEBSOCKET-IMPLEMENTATION.md`** - Detailed documentation

## 📝 Files Modified

1. **`server.js`** - Added HTTP server + WebSocket integration
2. **`package.json`** - Added `ws` dependency + test scripts

## 🚀 How to Use

### 1. Start the Server

```bash
npm run dev
```

You should see:
```
✅ Database connection established
📊 Database tables ready
🔌 NVR WebSocket server ready on /ws
💓 Heartbeat checker started (30s interval)
🚀 Server running on http://0.0.0.0:3000
📊 VMS Dashboard ready with Sequelize!
🔌 WebSocket server ready on ws://0.0.0.0:3000/ws
```

### 2. Test NVR Connection

In a **new terminal**:

```bash
npm run test:ws:nvr DESKTOP-T7MNQIA
```

Replace `DESKTOP-T7MNQIA` with any valid NVR hostname from your database.

### 3. Test Dashboard Client

In **another terminal**:

```bash
npm run test:ws:dashboard
```

### 4. Watch the Magic

1. When NVR connects, you'll see in server logs:
   ```
   ✅ NVR authenticated: NVR-Name (hostname)
   ✅ NVR marked online
   ✅ Updated X cameras to online
   ```

2. When NVR disconnects (Ctrl+C), you'll see:
   ```
   🔌 NVR disconnected: hostname
   ❌ NVR marked offline
   ❌ Updated X cameras to offline
   ```

3. Dashboard client will receive real-time updates for all NVR status changes.

## 📋 NVR Client Implementation

For your actual NVR devices, implement this in your NVR agent:

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://your-server:3000/ws');

ws.on('open', () => {
  // Authenticate with hostname
  ws.send(JSON.stringify({
    type: 'auth',
    hostname: 'DESKTOP-T7MNQIA'  // Your NVR hostname
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'auth_ok') {
    console.log('Authenticated!');
    
    // Start heartbeat every 10 seconds
    setInterval(() => {
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }, 10000);
  }
});
```

## 🔧 Configuration

### Heartbeat Interval

Currently set to **30 seconds**. To change:

Edit `src/websocket/nvr-websocket.js` line 319:
```javascript
}, 30000); // Change this number (milliseconds)
```

### WebSocket Path

Currently `/ws`. To change:

Edit `src/websocket/nvr-websocket.js` line 28:
```javascript
path: '/ws'  // Change this
```

## 🐛 Troubleshooting

### "Invalid hostname"
- NVR hostname must exist in `nvrs` table
- Hostname must be unique

### "Cameras not updating"
- Check `nvr_id` in cameras table matches NVR ID
- Verify database relationships are set up

### "Dashboard not receiving updates"
- Dashboard client must send `{ type: "dashboard" }` message
- Check WebSocket connection is established

## 🔍 Database Impact

The system automatically updates these tables:

**nvrs**:
- `status` → 'online' or 'offline'
- `last_seen` → current timestamp

**cameras**:
- `status` → 'online' or 'offline' (all cameras under the NVR)

## 📊 Monitoring

View connection stats in your code:

```javascript
const nvrWebSocket = require('./src/websocket/nvr-websocket');
const stats = nvrWebSocket.getStats();
console.log(stats);
// Output: { nvr_connections: 2, dashboard_clients: 3, nvr_hostnames: [...] }
```

## ✨ Next Steps

1. **Integrate with your NVR agents** - Add WebSocket client to your NVR monitoring code
2. **Frontend integration** - Connect dashboard UI to WebSocket for real-time updates
3. **Add authentication** - Implement JWT or API key auth for production
4. **SSL/TLS** - Use WSS (WebSocket Secure) in production

## 📚 More Info

See `WEBSOCKET-IMPLEMENTATION.md` for detailed documentation.

