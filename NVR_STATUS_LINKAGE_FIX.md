# NVR Status Linkage Fix

## Problem Identified

The user correctly identified that NVR status was not linked to camera statuses. When all cameras were set to offline, the NVR remained online instead of updating to warning status.

## Root Cause

The NVR status was managed independently from camera statuses. There was no automatic mechanism to update NVR status based on the health of its associated cameras.

## Solution Implemented

### 1. Created NVR Status Calculation Utilities

**File**: `src/utils/validation.js`

Added two new functions:

#### `calculateNVRStatus(NVR, Camera, nvrId)`
- Analyzes all cameras associated with an NVR
- Applies business logic to determine appropriate NVR status:
  - **All cameras online** → NVR status: `online`
  - **All cameras offline** → NVR status: `warning` (NVR may still be functional)
  - **Mix of online/offline/warning/maintenance** → NVR status: `warning`
  - **No cameras** → NVR status: `warning`

#### `updateNVRStatus(NVR, Camera, nvrId)`
- Calculates the new status using `calculateNVRStatus`
- Updates the NVR record in the database
- Provides console logging for status changes

### 2. Integrated NVR Status Updates in Camera Controller

**File**: `src/controllers/camera.controller.js`

Added automatic NVR status updates in all camera status-changing operations:

#### Camera Creation (`createCamera`)
- **When**: After a new camera is created and assigned to an NVR
- **Why**: New camera might change the overall NVR health status

#### Camera Status Update (`updateCameraById`, `updateCameraByName`)
- **When**: After a camera's status is changed (online → offline, etc.)
- **Why**: Camera status changes directly affect NVR health assessment
- **Logic**: Only triggers NVR update if status actually changed

#### Camera Deletion (`deleteCameraById`, `deleteCameraByName`)
- **When**: After a camera is soft-deleted (status set to offline)
- **Why**: Removing cameras from service affects NVR health
- **Timing**: Updates NVR status before adjusting camera counts

## Business Logic Applied

### NVR Status Determination Rules

```javascript
if (allCamerasOffline) {
  nvrStatus = 'warning'; // NVR hardware may still be functional
} else if (anyCameraHasIssues) {
  nvrStatus = 'warning'; // Partial system degradation
} else if (allCamerasOnline) {
  nvrStatus = 'online';  // Optimal operation
} else {
  nvrStatus = 'warning'; // Default to warning for unknown states
}
```

### Status Hierarchy
1. **Online**: All cameras operational
2. **Warning**: Some cameras have issues or all cameras offline
3. **Offline**: Reserved for NVR hardware failures (not camera-related)
4. **Error**: Reserved for critical system errors

## Expected Behavior After Fix

### Scenario 1: All Cameras Go Offline
- **Before**: NVR remains `online`
- **After**: NVR automatically updates to `warning`

### Scenario 2: Some Cameras Return Online
- **Before**: Manual NVR status management required
- **After**: NVR automatically updates to `warning` (mixed status)

### Scenario 3: All Cameras Back Online
- **Before**: Manual NVR status management required  
- **After**: NVR automatically updates to `online`

### Scenario 4: New Camera Added
- **Before**: NVR status unchanged
- **After**: NVR status recalculated based on all cameras including new one

## Dashboard Impact

With this fix, the dashboard should now show:

```
Total Cameras: 2
Online: 0
Offline: 2
Warning: 0

NVR Status: WARNING (instead of staying online)
```

## Implementation Details

### Performance Considerations
- NVR status updates only occur when camera statuses actually change
- Single database query to fetch camera statuses per NVR
- Atomic updates to prevent race conditions

### Error Handling
- Graceful degradation if NVR status calculation fails
- Default to 'warning' status on errors
- Console logging for debugging status changes

### Consistency
- Applied across all camera CRUD operations
- Uniform status calculation logic
- Same business rules regardless of API endpoint used

## Testing Scenarios

To verify the fix works:

1. **Set all cameras to offline** → Verify NVR becomes 'warning'
2. **Set some cameras back online** → Verify NVR stays 'warning'  
3. **Set all cameras online** → Verify NVR becomes 'online'
4. **Create new offline camera** → Verify NVR status recalculates
5. **Delete cameras** → Verify NVR status updates appropriately

## Files Modified

1. `src/utils/validation.js` - Added NVR status calculation functions
2. `src/controllers/camera.controller.js` - Integrated NVR status updates in all camera operations

## Future Enhancements

Consider adding:
- Real-time WebSocket notifications for NVR status changes
- Historical logging of NVR status changes
- Configurable business rules for status determination
- Batch NVR status updates for bulk camera operations
