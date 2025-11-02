# API Update Endpoints - Postman Requests

## Update NVR Status

### Request 1: Update NVR Status to Online
```
Method: PATCH
URL: http://localhost:3000/api/nvrs/NVR-001

Headers:
Content-Type: application/json

Body (JSON):
{
  "status": "online",
  "uptime_percent": 99.5
}
```

### Request 2: Update NVR Status to Offline
```
Method: PATCH
URL: http://localhost:3000/api/nvrs/NVR-001

Headers:
Content-Type: application/json

Body (JSON):
{
  "status": "offline",
  "uptime_percent": 0.00
}
```

### Request 3: Update NVR Status to Warning
```
Method: PATCH
URL: http://localhost:3000/api/nvrs/NVR-001

Headers:
Content-Type: application/json

Body (JSON):
{
  "status": "warning",
  "uptime_percent": 75.50
}
```

### Request 4: Update Multiple NVR Fields
```
Method: PATCH
URL: http://localhost:3000/api/nvrs/NVR-001

Headers:
Content-Type: application/json

Body (JSON):
{
  "status": "online",
  "uptime_percent": 99.5,
  "max_cameras": 32,
  "current_cameras": 24,
  "processor": "Intel Core i7",
  "ram": "16GB"
}
```

---

## Update Camera Status

### Request 1: Update Camera Status to Online
```
Method: PATCH
URL: http://localhost:3000/api/cameras/CAM-001

Headers:
Content-Type: application/json

Body (JSON):
{
  "status": "online",
  "uptime_percent": 95.5
}
```

### Request 2: Update Camera Status to Offline
```
Method: PATCH
URL: http://localhost:3000/api/cameras/CAM-001

Headers:
Content-Type: application/json

Body (JSON):
{
  "status": "offline",
  "uptime_percent": 0.00
}
```

### Request 3: Update Camera Status to Warning
```
Method: PATCH
URL: http://localhost:3000/api/cameras/CAM-001

Headers:
Content-Type: application/json

Body (JSON):
{
  "status": "warning",
  "uptime_percent": 65.25
}
```

### Request 4: Update Camera Status to Maintenance
```
Method: PATCH
URL: http://localhost:3000/api/cameras/CAM-001

Headers:
Content-Type: application/json

Body (JSON):
{
  "status": "maintenance",
  "uptime_percent": 50.00
}
```

### Request 5: Update Multiple Camera Fields
```
Method: PATCH
URL: http://localhost:3000/api/cameras/CAM-001

Headers:
Content-Type: application/json

Body (JSON):
{
  "status": "online",
  "uptime_percent": 98.5,
  "position": "Updated Position - Front Entrance",
  "model": "4K-Ultra",
  "manufacturer": "Hikvision",
  "resolution": "3840x2160",
  "fps": 30,
  "bitrate": 8192,
  "edge_storage_size": 2000
}
```

---

## Status Values

### NVR Status:
- `online` - NVR is operational
- `offline` - NVR is not responding
- `warning` - NVR has issues but still functioning
- `error` - NVR has critical errors

### Camera Status:
- `online` - Camera is operational
- `offline` - Camera is not responding
- `warning` - Camera has issues but still functioning
- `maintenance` - Camera is under maintenance

---

## Response Examples

### Success Response:
```json
{
  "success": true,
  "message": "NVR updated successfully",
  "data": {
    "id": 79,
    "device_name": "NVR-001",
    "status": "online",
    "uptime_percent": "99.50"
  }
}
```

### Error Response (Not Found):
```json
{
  "success": false,
  "message": "NVR with name \"NVR-XXX\" not found"
}
```

### Error Response (Invalid Status):
```json
{
  "success": false,
  "message": "Invalid status. Must be one of: online, offline, warning, error"
}
```

---

## Notes

1. The camera name and NVR device_name are unique identifiers used to find the device
2. You can update any field in the database for both NVRs and cameras
3. Only the fields you provide in the JSON body will be updated
4. Status validation is enforced - invalid status values will be rejected
5. All updates return the modified device information in the response
