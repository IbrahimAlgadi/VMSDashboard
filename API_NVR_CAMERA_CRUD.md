# NVR & Camera CRUD API - Complete Reference

## Base URL
```
http://localhost:3000
```

---

## NVR CRUD Endpoints

### 1. CREATE NVR ✅
```
POST http://localhost:3000/api/nvrs

Headers:
Content-Type: application/json

Body:
{
  "device_name": "NVR-002",
  "ip_address": "192.168.1.102",
  "branch_id": 1,
  "processor": "Intel Core i7",
  "ram": "16GB",
  "max_cameras": 32,
  "status": "offline"
}
```

### 2. READ - Get All NVRs ✅
```
GET http://localhost:3000/api/nvrs
```

**Query Parameters (Optional):**
- `branch_id` - Filter by branch ID
- `status` - Filter by status (online, offline, warning, error)
- `is_active` - Filter by active status (true/false)

**Example with filters:**
```
GET http://localhost:3000/api/nvrs?branch_id=1&status=online&is_active=true
```

### 3. READ - Get NVR by ID ✅
```
GET http://localhost:3000/api/nvrs/79
```

### 4. UPDATE NVR by ID ✅
```
PATCH http://localhost:3000/api/nvrs/79

Headers:
Content-Type: application/json

Body:
{
  "status": "online",
  "uptime_percent": 99.5,
  "max_cameras": 64
}
```

### 5. UPDATE NVR by Name ✅
```
PATCH http://localhost:3000/api/nvrs/name/NVR-001

Headers:
Content-Type: application/json

Body:
{
  "status": "warning",
  "uptime_percent": 75.0
}
```

### 6. DELETE NVR ✅
```
DELETE http://localhost:3000/api/nvrs/79
```

**Soft Delete (Default):** Sets `is_active` to `false`
**Hard Delete:** Use `?hardDelete=true`

```
DELETE http://localhost:3000/api/nvrs/79?hardDelete=true
```

---

## Camera CRUD Endpoints

### 1. CREATE Camera ✅
```
POST http://localhost:3000/api/cameras

Headers:
Content-Type: application/json

Body:
{
  "name": "CAM-002",
  "position": "Back Entrance",
  "ip_address": "192.168.1.103",
  "branch_id": 1,
  "nvr_id": 79,
  "model": "4K-Ultra",
  "manufacturer": "Hikvision",
  "resolution": "3840x2160",
  "fps": 30,
  "status": "offline"
}
```

### 2. READ - Get All Cameras ✅
```
GET http://localhost:3000/api/cameras
```

**Query Parameters (Optional):**
- `branch_id` - Filter by branch ID
- `nvr_id` - Filter by NVR ID
- `status` - Filter by status (online, offline, warning, maintenance)

**Example with filters:**
```
GET http://localhost:3000/api/cameras?branch_id=1&status=online
```

### 3. READ - Get Camera by ID ✅
```
GET http://localhost:3000/api/cameras/634
```

### 4. UPDATE Camera by ID ✅
```
PATCH http://localhost:3000/api/cameras/634

Headers:
Content-Type: application/json

Body:
{
  "status": "online",
  "uptime_percent": 95.5,
  "position": "Updated Position"
}
```

### 5. UPDATE Camera by Name ✅
```
PATCH http://localhost:3000/api/cameras/name/CAM-001

Headers:
Content-Type: application/json

Body:
{
  "status": "warning",
  "uptime_percent": 65.25
}
```

### 6. DELETE Camera ✅
```
DELETE http://localhost:3000/api/cameras/634
```

**Soft Delete (Default):** Sets status to `offline` and decreases NVR camera count
**Hard Delete:** Use `?hardDelete=true`

```
DELETE http://localhost:3000/api/cameras/634?hardDelete=true
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

### Success Response (CREATE):
```json
{
  "success": true,
  "message": "NVR created successfully",
  "data": {
    "id": 80,
    "device_name": "NVR-002",
    "ip_address": "192.168.1.102",
    "status": "offline",
    "branch": "King Fahd Branch",
    "max_cameras": 32,
    "current_cameras": 0,
    "uptime_percent": "0.00"
  }
}
```

### Success Response (GET ALL):
```json
{
  "success": true,
  "data": [
    {
      "id": 79,
      "device_name": "NVR-001",
      "ip_address": "192.168.1.100",
      "status": "online",
      "branch": {
        "id": 1,
        "name": "King Fahd Branch"
      }
    }
  ]
}
```

### Success Response (GET BY ID):
```json
{
  "success": true,
  "data": {
    "id": 79,
    "device_name": "NVR-001",
    "ip_address": "192.168.1.100",
    "status": "online",
    "uptime_percent": "99.50",
    "branch": {
      "id": 1,
      "name": "King Fahd Branch",
      "branch_code": "RD-001"
    }
  }
}
```

### Success Response (UPDATE):
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

### Success Response (DELETE - Soft):
```json
{
  "success": true,
  "message": "NVR deactivated successfully",
  "data": {
    "id": 79,
    "device_name": "NVR-001",
    "is_active": false
  }
}
```

### Success Response (DELETE - Hard):
```json
{
  "success": true,
  "message": "NVR deleted successfully"
}
```

---

## Error Responses

### Not Found (404):
```json
{
  "success": false,
  "message": "NVR with ID 999 not found"
}
```

### Validation Error (400):
```json
{
  "success": false,
  "message": "Device name, IP address, and branch are required"
}
```

### Duplicate Error (400):
```json
{
  "success": false,
  "message": "A NVR with this device name already exists"
}
```

### Invalid Status (400):
```json
{
  "success": false,
  "message": "Invalid status. Must be one of: online, offline, warning, error"
}
```

### Server Error (500):
```json
{
  "success": false,
  "message": "Internal server error while creating NVR"
}
```

---

## CRUD Operations Summary

### NVR Endpoints:
| Operation | Method | Endpoint | Status |
|-----------|--------|----------|--------|
| Create | POST | `/api/nvrs` | ✅ |
| Read All | GET | `/api/nvrs` | ✅ |
| Read One | GET | `/api/nvrs/:id` | ✅ |
| Update (ID) | PATCH | `/api/nvrs/:id` | ✅ |
| Update (Name) | PATCH | `/api/nvrs/name/:name` | ✅ |
| Delete | DELETE | `/api/nvrs/:id` | ✅ |

### Camera Endpoints:
| Operation | Method | Endpoint | Status |
|-----------|--------|----------|--------|
| Create | POST | `/api/cameras` | ✅ |
| Read All | GET | `/api/cameras` | ✅ |
| Read One | GET | `/api/cameras/:id` | ✅ |
| Update (ID) | PATCH | `/api/cameras/:id` | ✅ |
| Update (Name) | PATCH | `/api/cameras/name/:name` | ✅ |
| Delete | DELETE | `/api/cameras/:id` | ✅ |

---

## Notes

1. **Soft vs Hard Delete:**
   - **Soft Delete (Default):** Sets `is_active=false` for NVRs, or `status='offline'` for cameras
   - **Hard Delete:** Use `?hardDelete=true` to permanently delete records

2. **Update Endpoints:**
   - Both ID-based and name-based update endpoints are available
   - Only send fields you want to update (partial updates)

3. **Query Filters:**
   - GET all endpoints support optional query parameters for filtering
   - Multiple filters can be combined

4. **Foreign Key Validation:**
   - Creating/updating requires valid `branch_id` and `nvr_id` (for cameras)
   - The API validates these relationships before creating/updating

5. **Unique Constraints:**
   - NVR: `device_name` and `ip_address` must be unique
   - Camera: `name` and `ip_address` must be unique
