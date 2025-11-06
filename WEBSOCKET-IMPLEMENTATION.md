# WebSocket Heartbeat Implementation

## Overview

Implemented a WebSocket-based heartbeat system for NVR devices to track their online/offline status automatically. When an NVR disconnects, all associated cameras are automatically marked offline.

## Architecture

### Components

1. **WebSocket Server** (`src/websocket/nvr-websocket.js`)
   - Handles NVR authentication via hostname
   - Manages heartbeat detection
   - Synchronizes NVR and camera status
   - Broadcasts real-time updates to dashboard clients

2. **HTTP Server** (`server.js`)
   - Attaches WebSocket server to existing Express server
   - Graceful shutdown handling

3. **Test Clients**
   - `test-nvr-websocket.js` - Simulates NVR connection
   - `test-dashboard-websocket.js` - Simulates dashboard client

## How It Works

### 1. NVR Connection Flow

```
NVR Client          WebSocket Server          Database
    |                      |                      |
    |---- connect -------->|                      |
    |                      |                      |
    |----- auth ---------->|                      |
    |   (hostname)         |                      |
    |                      |--- find NVR --------->
    |                      |<-- NVR data ---------|
    |<--- auth_ok ---------|                      |
    |                      |--- mark NVR online -->|
    |                      |--- mark cameras ----->|
    |                      |    online            |
    |                      |                      |
    |----- heartbeat ----->|                      |
    |   (every 10s)        |                      |
    |                      |--- update last_seen ->|
```

### 2. Disconnection Flow

```
NVR Client          WebSocket Server          Database
    |                      |                      |
    |---- disconnect ----->|                      |
    |                      |--- mark NVR --------->|
    |                      |    offline           |
    |                      |--- mark cameras ----->|
    |                      |    offline           |
    |                      |--- broadcast -------->|
    |                      |    to dashboard      |
```

### 3. Message Protocol

#### NVR Authentication
```json
// Client → Server
{
  "type": "auth",
  "hostname": "DESKTOP-T7MNQIA"
}

// Server → Client
{
  "type": "auth_ok",
  "hostname": "DESKTOP-T7MNQIA",
  "device_name": "NVR-Main-Branch-01"
}
```

#### Heartbeat
```json
// Client → Server
{
  "type": "heartbeat",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Dashboard Registration
```json
// Client → Server
{
  "type": "dashboard"
}

// Server → Client
{
  "type": "dashboard_ok",
  "message": "Dashboard connected to WebSocket server"
}
```

#### Status Updates (Broadcast to Dashboard)
```json
{
  "type": "nvr_online",  // or "nvr_offline"
  "hostname": "DESKTOP-T7MNQIA",
  "device_name": "NVR-Main-Branch-01",
  "nvr_id": 1,
  "cameras_updated": 5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage

### Starting the Server

```bash
npm run dev
```

The WebSocket server will be available at: `ws://localhost:3000/ws`

### Testing NVR Connection

```bash
# In one terminal, start the server
npm run dev

# In another terminal, simulate NVR connection
npm run test:ws:nvr DESKTOP-T7MNQIA
```

### Testing Dashboard Client

```bash
# In one terminal, start the server
npm run dev

# In another terminal, simulate dashboard client
npm run test:ws:dashboard
```

### Testing Full Flow

1. Start the server: `npm run dev`
2. Start dashboard client: `npm run test:ws:dashboard` (Terminal 1)
3. Start NVR client: `npm run test:ws:nvr DESKTOP-T7MNQIA` (Terminal 2)
4. Watch Terminal 1 for status updates when NVR connects/disconnects
5. Press Ctrl+C in Terminal 2 to disconnect NVR
6. Observe NVR and cameras marked offline in Terminal 1

## Key Features

### 1. Automatic Status Management
- NVR connects → automatically marks NVR + cameras online
- NVR disconnects → automatically marks NVR + cameras offline
- No manual intervention required

### 2. Heartbeat Detection
- Server pings NVR connections every 30 seconds
- Stale connections are automatically terminated
- Prevents hanging connections

### 3. Real-time Dashboard Updates
- Dashboard clients receive instant status updates
- No polling required
- Broadcast to all connected dashboard clients

### 4. Connection Mapping
- Each NVR identified by unique `hostname`
- WebSocket → hostname mapping for disconnect detection
- Automatic cleanup on disconnect

## Integration with Existing System

### Database Updates
The WebSocket server automatically updates:

- **nvrs** table:
  - `status` → 'online' or 'offline'
  - `last_seen` → current timestamp

- **cameras** table:
  - `status` → 'online' or 'offline' (for all cameras under the NVR)

### No Breaking Changes
- Existing HTTP API endpoints unchanged
- Health metrics ingestion still works
- WebSocket is additive layer

## Configuration

### WebSocket Settings

Located in `src/websocket/nvr-websocket.js`:

```javascript
// Heartbeat interval (milliseconds)
this.heartbeatInterval = 30000; // 30 seconds

// WebSocket path
path: '/ws'
```

### Customization

To modify the heartbeat interval:

```javascript
// In src/websocket/nvr-websocket.js
this.heartbeatInterval = setInterval(() => {
  // ...
}, 60000); // Change to 60 seconds
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Invalid hostname** → Connection closed with error code
2. **Database errors** → Logged, connection remains open
3. **Network errors** → Graceful disconnect
4. **Heartbeat failures** → Automatic termination

## Monitoring

### Console Logs

The server provides detailed logging:

```
✅ NVR authenticated: NVR-Main-Branch-01 (DESKTOP-T7MNQIA)
💓 Heartbeat sent
🔌 NVR disconnected: DESKTOP-T7MNQIA
❌ NVR marked offline: NVR-Main-Branch-01
✅ Updated 5 cameras to offline for NVR NVR-Main-Branch-01
📡 Broadcasted to 2 dashboard clients: nvr_offline
```

### Statistics

Get connection statistics via `nvrWebSocket.getStats()`:

```javascript
{
  nvr_connections: 2,
  dashboard_clients: 3,
  nvr_hostnames: ['DESKTOP-T7MNQIA', 'DESKTOP-ABC123']
}
```

## Deployment Considerations

### Production Recommendations

1. **SSL/TLS**: Use WSS (WebSocket Secure) in production
   ```javascript
   const https = require('https');
   const server = https.createServer({ cert, key }, app);
   ```

2. **Authentication**: Add token-based auth for NVR connections
   ```javascript
   if (message.type === 'auth' && message.token) {
     // Verify JWT token
   }
   ```

3. **Rate Limiting**: Prevent connection spam
   ```javascript
   // Implement rate limiting per IP
   ```

4. **Monitoring**: Add metrics collection
   ```javascript
   // Track connections, messages, errors
   ```

## Troubleshooting

### Common Issues

1. **NVR not authenticating**
   - Verify hostname exists in `nvrs` table
   - Check hostname is unique

2. **No status updates in dashboard**
   - Ensure dashboard client sends `{ type: "dashboard" }` message
   - Verify WebSocket connection is established

3. **Cameras not updating**
   - Check `nvr_id` relationship in database
   - Verify camera records exist

### Debug Mode

Enable debug logging:

```javascript
// Set NODE_ENV to development for verbose logging
NODE_ENV=development npm run dev
```

## Future Enhancements

Potential improvements:

1. **Camera-level heartbeats** - Individual camera status tracking
2. **Metrics streaming** - Real-time metrics via WebSocket
3. **Alert broadcasting** - Push alerts to dashboard clients
4. **Connection pooling** - Handle many concurrent NVRs
5. **Reconnection logic** - Automatic NVR reconnection with backoff

## License

MIT

