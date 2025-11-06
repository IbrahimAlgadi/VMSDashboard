# Camera Status Update Strategy

## Overview

Camera online/offline status is **ONLY** managed through WebSocket connections with NVR devices.

## Architecture

### ✅ WebSocket - The ONLY Way to Change Camera Status

**Location**: `src/websocket/nvr-websocket.js`

**How it works**:
1. NVR connects via WebSocket with its `hostname`
2. Server authenticates and marks NVR + all cameras as **online**
3. NVR sends periodic heartbeat
4. On disconnect, NVR + all cameras marked as **offline**

**Code**:
```javascript
// On NVR connect
await Camera.update(
  { status: 'online' },
  { where: { nvr_id: nvr.id, status: 'offline' } }
);

// On NVR disconnect
await Camera.update(
  { status: 'offline' },
  { where: { nvr_id: nvr.id, status: 'online' } }
);
```

### ❌ Data Ingestion - NO STATUS CHANGES

**Location**: `src/controllers/camera.controller.js` - `ingestComprehensiveData()`

**What it does**:
- Updates camera hardware info (manufacturer, model, resolution, etc.)
- Updates health metrics
- Creates alerts
- **DOES NOT** update camera status

**Code**:
```javascript
// NOTE: Status is NOT updated here - only through WebSocket
const cameraUpdate = {
  updated_at: new Date()
};
// Only updates hardware info, NOT status
```

### ❌ Manual API Updates - NO STATUS CHANGES

**Location**: `src/controllers/camera.controller.js` - `updateCameraByName()` / `updateCameraById()`

**Status**: These endpoints can still manually update status, but:
- WebSocket will override on NVR connect/disconnect
- Not recommended for production use
- Use only for manual intervention/testing

## Why This Design?

### Single Source of Truth
- **WebSocket = Reality**: If NVR is connected, cameras are online
- **No Conflicting States**: Only one mechanism controls status

### Simplicity
- Clear separation of concerns
- Data ingestion focuses on metrics, not connectivity
- Easier to debug and maintain

### Accuracy
- WebSocket heartbeat is real-time
- Cannot have stale status (NVR offline but camera shows online)
- Automatic synchronization

## Status Flow Diagram

```
┌─────────────┐
│   NVR On    │
│  WebSocket  │
└──────┬──────┘
       │ Connect
       ▼
┌─────────────────────────┐
│ NVR + All Cameras       │
│ Status: ONLINE          │
└─────────────────────────┘
       │ Heartbeat
       │ Every 30s
       ▼
┌─────────────────────────┐
│ Update last_seen        │
│ Keep status: ONLINE     │
└─────────────────────────┘
       │ Disconnect
       ▼
┌─────────────────────────┐
│ NVR + All Cameras       │
│ Status: OFFLINE         │
└─────────────────────────┘
```

## Data Ingestion Flow (No Status Changes)

```
┌─────────────────────┐
│ Health Data Arrives │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Update Hardware Info│
│ - manufacturer      │
│ - model             │
│ - resolution        │
│ - fps, bitrate      │
│ - edge_storage      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Update Health Metrics│
│ - quality_score     │
│ - ping_ms           │
│ - bitrate           │
│ - storage info      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Create Alerts       │
│ (if critical)       │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Status UNCHANGED    │
│ (WebSocket controls)│
└─────────────────────┘
```

## Testing

### Test WebSocket Status Updates

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Connect NVR
npm run test:ws:nvr DESKTOP-T7MNQIA

# Terminal 3: Watch dashboard
npm run test:ws:dashboard
```

**Expected Behavior**:
- On connect: NVR + cameras → online
- On disconnect: NVR + cameras → offline

### Test Data Ingestion (No Status Change)

```bash
curl -X PATCH http://localhost:3000/api/cameras/ingest-comprehensive-data/DESKTOP-T7MNQIA/192.168.0.111 \
  -H "Content-Type: application/json" \
  -d @comprehensive-camera-data.json
```

**Expected Behavior**:
- Hardware info updated ✅
- Health metrics updated ✅
- Status: **UNCHANGED** ✅

## Implementation Details

### WebSocket Status Updates

```javascript
// Connection tracking
this.nvrConnections = new Map(); // hostname → WebSocket

// On authentication
ws.hostname = hostname;
await this.markNVRAndCamerasOnline(hostname);

// On disconnect
await this.markNVRAndCamerasOffline(hostname);
```

### Data Ingestion

```javascript
// NO status in cameraUpdate
const cameraUpdate = {
  updated_at: new Date()
  // NO status field!
};

await camera.update(cameraUpdate, { transaction: t });
```

## Benefits

1. **Clear Ownership**: WebSocket owns status, nothing else
2. **No Race Conditions**: Single source of truth prevents conflicts
3. **Real-time Accuracy**: Status reflects actual NVR connection
4. **Simplified Debugging**: One place to check for status logic
5. **Automatic Sync**: Cameras always match NVR state

## Future Considerations

If you need more granular camera status:
- Individual camera heartbeat (optional)
- Camera-level WebSocket connections
- Hybrid approach: NVR connectivity + per-camera health

For now, **keep it simple**: NVR online = all cameras online.

## Summary

| Operation | Updates Status? | Purpose |
|-----------|----------------|---------|
| NVR WebSocket Connect | ✅ Yes | Mark online |
| NVR WebSocket Disconnect | ✅ Yes | Mark offline |
| Data Ingestion | ❌ No | Update metrics only |
| Manual API | ⚠️ Maybe | Testing only |

**Rule**: WebSocket controls status. Everything else updates data.

