# Real-Time Update System - Implementation Plan

## Overview

Implement a centralized, intelligent real-time update system that automatically updates NVR and camera statuses across all pages (Dashboard, NVR Management, Camera Management) using WebSocket connections.

## Architecture

### 1. Core Components

```
┌─────────────────────────────────────────────────────────┐
│              WebSocket Client Manager                    │
│  - Connection management                                 │
│  - Auto-reconnection                                     │
│  - Message routing                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼──────────┐
│  State Manager │   │  Event Emitter    │
│  - NVR state   │   │  - Status events  │
│  - Camera state│   │  - Alert events   │
│  - Cache       │   │  - Broadcast      │
└───────┬────────┘   └────────┬──────────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Page Controllers   │
        │  - Dashboard        │
        │  - NVR Management   │
        │  - Camera Management│
        └─────────────────────┘
```

## Implementation Plan

### Phase 1: Core WebSocket Client Library

**File**: `public/js/core/websocket-client.js`

**Features**:
- Single WebSocket connection per page
- Auto-reconnection with exponential backoff
- Connection status indicator
- Message queue for offline scenarios
- Heartbeat detection

**API**:
```javascript
WebSocketClient.connect()
WebSocketClient.disconnect()
WebSocketClient.on(event, callback)
WebSocketClient.off(event, callback)
WebSocketClient.isConnected()
WebSocketClient.getConnectionStatus()
```

**Events**:
- `connected` - WebSocket connected
- `disconnected` - WebSocket disconnected
- `reconnecting` - Attempting to reconnect
- `error` - Connection error
- `nvr_online` - NVR came online
- `nvr_offline` - NVR went offline
- `nvr_status_update` - NVR status changed
- `camera_status_update` - Camera status changed
- `alert` - New alert received

### Phase 2: State Management System

**File**: `public/js/core/state-manager.js`

**Purpose**: Centralized state store for NVRs and cameras

**Features**:
- In-memory cache of NVR and camera data
- Subscribe/unsubscribe to state changes
- Automatic UI updates when state changes
- Optimistic updates
- State persistence (optional)

**API**:
```javascript
StateManager.setNVR(nvrId, nvrData)
StateManager.getNVR(nvrId)
StateManager.getAllNVRs()
StateManager.setCamera(cameraId, cameraData)
StateManager.getCamera(cameraId)
StateManager.getCamerasByNVR(nvrId)
StateManager.subscribe(key, callback)
StateManager.unsubscribe(key, callback)
StateManager.updateFromServer(data)
```

**State Structure**:
```javascript
{
  nvrs: {
    [nvrId]: {
      id, hostname, device_name, status, last_seen, ...
    }
  },
  cameras: {
    [cameraId]: {
      id, name, nvr_id, status, ip_address, ...
    }
  },
  summary: {
    totalNVRs, onlineNVRs, offlineNVRs,
    totalCameras, onlineCameras, offlineCameras
  }
}
```

### Phase 3: Event System

**File**: `public/js/core/event-bus.js`

**Purpose**: Decoupled event communication between components

**Features**:
- Pub/sub pattern
- Event namespacing
- Event history (optional)
- Priority handling

**API**:
```javascript
EventBus.on(event, callback)
EventBus.off(event, callback)
EventBus.emit(event, data)
EventBus.once(event, callback)
```

**Event Types**:
- `nvr:status:changed` - NVR status updated
- `camera:status:changed` - Camera status updated
- `nvr:online` - NVR came online
- `nvr:offline` - NVR went offline
- `camera:online` - Camera came online
- `camera:offline` - Camera went offline
- `alert:new` - New alert created
- `stats:updated` - Summary statistics updated

### Phase 4: Notification/Alert System

**File**: `public/js/components/notifications.js`

**Purpose**: Show toast notifications for status changes

**Features**:
- Toast notifications
- Sound alerts (optional)
- Notification queue
- Dismissible alerts
- Different styles for different event types

**API**:
```javascript
Notifications.show(message, type, duration)
Notifications.success(message)
Notifications.error(message)
Notifications.warning(message)
Notifications.info(message)
```

**Notification Types**:
- `success` - Green (NVR/camera online)
- `error` - Red (NVR/camera offline)
- `warning` - Yellow (Status warning)
- `info` - Blue (General info)

### Phase 5: Page-Specific Update Handlers

#### 5.1 Dashboard Updates

**File**: `public/js/pages/dashboard.js` (enhancement)

**Updates Required**:
- KPI cards (total NVRs, cameras, offline counts)
- Status distribution charts
- Recent alerts timeline
- System health indicators
- Regional distribution

**Update Strategy**:
- Subscribe to `stats:updated` event
- Update KPI cards with animation
- Refresh charts with new data
- Add new alerts to timeline
- Update last update timestamp

#### 5.2 NVR Management Updates

**File**: `public/js/pages/nvr-management.js` (enhancement)

**Updates Required**:
- NVR table rows (status badges, last seen)
- Statistics bar (online/offline counts)
- Filter counts
- Detail modal (if open)

**Update Strategy**:
- Subscribe to `nvr:status:changed` event
- Update specific table row
- Update statistics bar
- Refresh filter counts
- Update modal if viewing that NVR
- Show notification for status changes

#### 5.3 Camera Management Updates

**File**: `public/js/pages/camera-management.js` (enhancement)

**Updates Required**:
- Camera grid/table (status badges)
- Statistics bar
- Filter counts
- Detail modal (if open)

**Update Strategy**:
- Subscribe to `camera:status:changed` event
- Update specific camera card/row
- Update statistics bar
- Refresh filter counts
- Update modal if viewing that camera
- Show notification for status changes

### Phase 6: Smart Update Optimizations

**Features**:
- **Debouncing**: Batch multiple rapid updates
- **Throttling**: Limit update frequency
- **Selective Updates**: Only update visible elements
- **Virtual Scrolling**: For large tables (future)
- **Lazy Loading**: Load data on demand

**Update Frequency**:
- Status changes: Immediate
- Statistics: Debounced (500ms)
- Charts: Throttled (1s)
- Alerts: Immediate

## File Structure

```
public/js/
├── core/
│   ├── websocket-client.js    # WebSocket connection manager
│   ├── state-manager.js       # Centralized state store
│   └── event-bus.js           # Event system
├── components/
│   ├── notifications.js       # Toast notifications
│   └── connection-status.js   # Connection indicator
└── pages/
    ├── dashboard.js           # Enhanced with real-time
    ├── nvr-management.js      # Enhanced with real-time
    └── camera-management.js   # Enhanced with real-time
```

## Implementation Details

### 1. WebSocket Client Implementation

```javascript
class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.messageQueue = [];
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      // Register as dashboard client
      this.send({ type: 'dashboard' });
      this.reconnectAttempts = 0;
      this.emit('connected');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      this.emit('disconnected');
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  handleMessage(message) {
    switch(message.type) {
      case 'nvr_online':
      case 'nvr_offline':
      case 'nvr_status_update':
        this.emit('nvr:status:changed', message);
        break;
      case 'camera_status_update':
        this.emit('camera:status:changed', message);
        break;
    }
  }
}
```

### 2. State Manager Implementation

```javascript
class StateManager {
  constructor() {
    this.state = {
      nvrs: {},
      cameras: {},
      summary: {}
    };
    this.subscribers = new Map();
  }

  setNVR(nvrId, nvrData) {
    const oldData = this.state.nvrs[nvrId];
    this.state.nvrs[nvrId] = nvrData;
    
    if (oldData?.status !== nvrData.status) {
      this.notify('nvr:status:changed', { nvrId, oldStatus: oldData?.status, newStatus: nvrData.status });
      this.updateSummary();
    }
  }

  setCamera(cameraId, cameraData) {
    const oldData = this.state.cameras[cameraId];
    this.state.cameras[cameraId] = cameraData;
    
    if (oldData?.status !== cameraData.status) {
      this.notify('camera:status:changed', { cameraId, oldStatus: oldData?.status, newStatus: cameraData.status });
      this.updateSummary();
    }
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);
  }

  notify(key, data) {
    const callbacks = this.subscribers.get(key) || [];
    callbacks.forEach(cb => cb(data));
  }
}
```

### 3. Page Integration Pattern

```javascript
// In dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  // Initialize real-time updates
  RealtimeManager.init();
  
  // Subscribe to updates
  RealtimeManager.on('stats:updated', (summary) => {
    updateKPICards(summary);
    updateCharts(summary);
  });
  
  RealtimeManager.on('nvr:status:changed', (data) => {
    updateNVRStatus(data);
    showNotification(`NVR ${data.device_name} is now ${data.status}`);
  });
  
  // Load initial data
  loadDashboard();
});
```

## Update Flow

### Scenario: NVR Goes Offline

```
1. NVR disconnects from WebSocket
   ↓
2. Server broadcasts: { type: 'nvr_offline', hostname: '...', cameras_updated: 5 }
   ↓
3. WebSocketClient receives message
   ↓
4. WebSocketClient emits: 'nvr:status:changed'
   ↓
5. StateManager updates state:
   - Sets NVR status to 'offline'
   - Sets all cameras to 'offline'
   - Updates summary statistics
   ↓
6. StateManager notifies subscribers:
   - Dashboard: Updates KPI cards, charts
   - NVR Management: Updates table row, statistics
   - Camera Management: Updates camera cards, statistics
   ↓
7. Notifications.show() displays toast
   ↓
8. UI updates with smooth animations
```

## Performance Considerations

### 1. Update Batching
- Collect updates for 100ms
- Batch DOM updates
- Use `requestAnimationFrame` for smooth animations

### 2. Selective Rendering
- Only update changed elements
- Use data attributes to identify elements: `data-nvr-id`, `data-camera-id`
- Virtual DOM diffing (if needed)

### 3. Memory Management
- Limit state cache size
- Clean up old data
- Unsubscribe on page unload

### 4. Network Optimization
- Compress WebSocket messages
- Only send changed data
- Rate limiting on client side

## User Experience Enhancements

### 1. Visual Feedback
- Status change animations (fade, pulse)
- Color transitions (green → red for offline)
- Loading indicators during updates

### 2. Connection Status
- Indicator in navbar (green/yellow/red)
- Reconnection notification
- Offline mode indicator

### 3. Notifications
- Toast notifications for important changes
- Sound alerts (optional, user preference)
- Notification center (future)

### 4. Smooth Transitions
- CSS transitions for status changes
- Fade in/out for new/removed items
- Progress indicators

## Testing Strategy

### 1. Unit Tests
- WebSocket client connection/disconnection
- State manager updates
- Event bus pub/sub

### 2. Integration Tests
- End-to-end update flow
- Multiple page updates
- Reconnection scenarios

### 3. Manual Testing
- Test with real NVR connections
- Test with multiple browsers
- Test with network interruptions

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] WebSocket client library
- [ ] State manager
- [ ] Event bus
- [ ] Basic connection status indicator

### Phase 2: Core Updates (Week 1-2)
- [ ] Dashboard real-time updates
- [ ] NVR Management real-time updates
- [ ] Camera Management real-time updates
- [ ] Notification system

### Phase 3: Enhancements (Week 2)
- [ ] Performance optimizations
- [ ] Visual animations
- [ ] Error handling
- [ ] Reconnection logic

### Phase 4: Polish (Week 2-3)
- [ ] User preferences
- [ ] Sound alerts
- [ ] Notification center
- [ ] Documentation

## Configuration Options

```javascript
const RealtimeConfig = {
  // WebSocket settings
  wsUrl: '/ws',
  reconnectAttempts: 10,
  reconnectDelay: 1000,
  
  // Update settings
  debounceDelay: 500,
  throttleDelay: 1000,
  
  // Notification settings
  showNotifications: true,
  soundAlerts: false,
  notificationDuration: 5000,
  
  // Performance
  batchUpdates: true,
  updateOnlyVisible: true,
  maxCacheSize: 1000
};
```

## Backwards Compatibility

- Pages work without WebSocket (fallback to polling)
- Graceful degradation if WebSocket fails
- Server-rendered data as initial state
- Progressive enhancement approach

## Security Considerations

- WebSocket authentication (if needed)
- Rate limiting
- Input validation
- XSS prevention in notifications

## Future Enhancements

1. **Real-time Charts**: Live chart updates
2. **Live Video Status**: Camera stream status
3. **Collaborative Features**: Multiple users viewing same page
4. **Offline Queue**: Queue updates when offline
5. **Web Push Notifications**: Browser notifications
6. **Mobile App**: React Native app with same WebSocket

## Success Metrics

- ✅ Status updates appear within 1 second
- ✅ No page refresh required
- ✅ Smooth animations
- ✅ No performance degradation
- ✅ Works across all browsers
- ✅ Handles reconnections gracefully

## Questions for Review

1. **Notification Preferences**: Should users be able to disable notifications?
2. **Update Frequency**: Is 1 second update delay acceptable?
3. **Sound Alerts**: Should we include sound alerts by default?
4. **Offline Mode**: Should we queue updates when offline?
5. **Mobile Support**: Priority for mobile optimization?
6. **Browser Support**: Which browsers must be supported?

---

## Summary

This plan provides:
- ✅ Centralized WebSocket client
- ✅ State management system
- ✅ Event-driven architecture
- ✅ Page-specific update handlers
- ✅ Notification system
- ✅ Performance optimizations
- ✅ Smooth user experience

**Estimated Implementation Time**: 2-3 weeks
**Complexity**: Medium
**Maintenance**: Low (centralized code)

Please review and provide feedback before implementation!

