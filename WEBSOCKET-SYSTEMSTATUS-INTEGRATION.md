# WebSocket systemStatus Integration

## Overview

The WebSocket server now supports per-camera status updates via `systemStatus` payload from NVR clients. This allows granular camera status tracking instead of bulk "all online" or "all offline" updates.

## How It Works

### Message Format

NVR clients send `systemStatus` in both `auth` and `heartbeat` messages:

```javascript
{
  type: 'auth',  // or 'heartbeat'
  hostname: 'DESKTOP-T7MNQIA',
  systemStatus: {
    status: 'online',  // NVR status (optional)
    cameras: [
      { name: 'CAM-001', ip_address: '192.168.0.101', status: 'online' },
      { name: 'CAM-002', ip_address: '192.168.0.102', status: 'offline' }
    ]
  }
}
```

### Processing Flow

1. **NVR Authentication**:
   - If `systemStatus` provided → Process per-camera status
   - If not provided → Fallback to all cameras online

2. **Heartbeat**:
   - Updates `last_seen` for NVR
   - If `systemStatus` provided → Process per-camera status updates

3. **Disconnect**:
   - Mark NVR as offline
   - Mark all cameras as offline

## Implementation Details

### New Methods

#### `processSystemStatus(hostname, systemStatus)`

Processes camera status updates from NVR's reported state:

```javascript
// Updates each camera individually based on NVR's reported status
for (const cameraStatus of systemStatus.cameras) {
  const camera = await Camera.findOne({
    where: { 
      name: cameraStatus.name,
      nvr_id: nvr.id
    }
  });
  
  if (camera && camera.status !== cameraStatus.status) {
    await camera.update({ status: cameraStatus.status });
  }
}
```

**Features**:
- Per-camera status updates
- Only updates cameras that changed status
- Logs each status change
- Broadcasts updates to dashboard clients

#### `markNVROnline(hostname)`

Marks NVR as online (without touching cameras):

```javascript
await nvr.update({ 
  status: 'online', 
  last_seen: new Date() 
});
```

#### `markAllCamerasOnline(nvrId)`

Fallback method if no `systemStatus` provided:

```javascript
await Camera.update(
  { status: 'online' },
  { where: { nvr_id: nvrId, status: 'offline' } }
);
```

### Enhanced Message Handling

```javascript
// Auth with systemStatus
if (message.type === 'auth' && message.hostname) {
  await this.handleNVRAuth(ws, message.hostname, message.systemStatus);
}

// Heartbeat with systemStatus
if (message.type === 'heartbeat' && ws.hostname) {
  await this.updateLastSeen(ws.hostname);
  if (message.systemStatus) {
    await this.processSystemStatus(ws.hostname, message.systemStatus);
  }
}
```

## Integration with NVR Client

Your NVR client already sends the correct format:

```javascript
const authMessage = {
  type: 'auth',
  hostname: HOSTNAME,
  systemStatus: localNvrStatus  // ✅ This is now processed
};

const heartbeat = {
  type: 'heartbeat',
  timestamp: new Date().toISOString(),
  systemStatus: localNvrStatus  // ✅ This is now processed
};
```

### Example systemStatus from NVR

```javascript
{
  status: 'online',
  cameras: [
    {
      name: 'CAM-001',
      ip_address: '192.168.0.101',
      status: 'online'
    },
    {
      name: 'CAM-002', 
      ip_address: '192.168.0.102',
      status: 'offline'
    }
  ]
}
```

## Status Update Strategy

### Priority Order

1. **WebSocket Connect** → `processSystemStatus` if provided, else all online
2. **Heartbeat** → `processSystemStatus` updates individual cameras
3. **WebSocket Disconnect** → All cameras offline
4. **Data Ingestion** → NO status changes (removed)
5. **Manual API** → Only for testing

### Per-Camera vs Bulk Updates

| Scenario | Method | Behavior |
|----------|--------|----------|
| Connect with systemStatus | `processSystemStatus` | Individual camera status |
| Connect without systemStatus | `markAllCamerasOnline` | All cameras online |
| Heartbeat with systemStatus | `processSystemStatus` | Individual updates |
| Heartbeat without systemStatus | None | Only updates last_seen |
| Disconnect | `markNVRAndCamerasOffline` | All cameras offline |

## Dashboard Broadcasts

Dashboard clients receive updates:

```javascript
{
  type: 'nvr_status_update',
  hostname: 'DESKTOP-T7MNQIA',
  device_name: 'NVR-Main-Branch',
  nvr_id: 1,
  cameras_updated: 2,
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

## Testing

Updated test script includes mock `systemStatus`:

```bash
npm run test:ws:nvr DESKTOP-T7MNQIA
```

**Expected Output**:
```
📹 Camera CAM-001: offline → online
📹 Camera CAM-003: online → offline
✅ Updated 2 cameras based on NVR systemStatus
```

## Migration Notes

### Backwards Compatibility

- If NVR doesn't send `systemStatus` → falls back to all online
- Legacy bulk update still works
- New per-camera updates are additive

### Breaking Changes

None. Existing NVR clients will:
- Continue to work
- Get bulk status updates
- Can upgrade to per-camera by adding `systemStatus`

## Benefits

1. **Granular Updates**: Track individual camera states
2. **Real-time Accuracy**: Status reflects actual camera state from NVR
3. **Selective Updates**: Only changed cameras are updated
4. **Backwards Compatible**: Works with or without `systemStatus`
5. **Automatic Sync**: Cameras always match NVR's reported state

## Example: Mixed Status Scenario

```javascript
// NVR has 5 cameras: 3 online, 2 offline
systemStatus = {
  cameras: [
    { name: 'CAM-001', status: 'online' },
    { name: 'CAM-002', status: 'online' },
    { name: 'CAM-003', status: 'online' },
    { name: 'CAM-004', status: 'offline' },  // Camera detached
    { name: 'CAM-005', status: 'offline' }   // Camera detached
  ]
}
```

**Server Response**:
- CAM-001, CAM-002, CAM-003 → online
- CAM-004, CAM-005 → offline
- Dashboard shows correct mixed status
- NVR status: online (if NVR itself is connected)

## Summary

✅ **Per-camera status** via `systemStatus`  
✅ **Bulk updates** as fallback  
✅ **Real-time sync** with NVR state  
✅ **Dashboard broadcasts** for live updates  
✅ **Backwards compatible** with existing clients  

The system now provides **granular camera status tracking** while maintaining **simplicity** for basic scenarios.

