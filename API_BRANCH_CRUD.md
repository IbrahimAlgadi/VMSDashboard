# Branch CRUD API - Postman Requests

## Base URL
```
http://localhost:3000
```

---

## 1. CREATE Branch

### Request
```
Method: POST
URL: http://localhost:3000/api/branches

Headers:
Content-Type: application/json

Body (JSON):
{
  "name": "Main Branch Downtown",
  "region_id": 1,
  "branch_code": "BR-001",
  "branch_type": "Main Branch",
  "address": "123 Main Street, Riyadh 12211, Saudi Arabia",
  "coordinates": [24.7136, 46.6753],
  "contact_phone": "+966-11-123-4567",
  "manager_name": "Ahmed Al-Saud",
  "operating_hours": {
    "monday": {"start": "09:00", "end": "17:00"},
    "tuesday": {"start": "09:00", "end": "17:00"},
    "wednesday": {"start": "09:00", "end": "17:00"},
    "thursday": {"start": "09:00", "end": "17:00"},
    "friday": {"start": "14:00", "end": "22:00"},
    "saturday": {"start": "09:00", "end": "17:00"},
    "sunday": {"start": "09:00", "end": "17:00"}
  },
  "status": "online",
  "is_active": true
}
```

### Required Fields:
- `name` (string) - Branch name
- `region_id` (integer) - Region ID (must exist)
- `branch_code` (string) - Unique branch code
- `branch_type` (string) - Must be one of: `Main Branch`, `Branch`, `ATM`
- `address` (string) - Full address
- `coordinates` (array) - [latitude, longitude] as JSON array

### Optional Fields:
- `contact_phone` (string)
- `manager_name` (string)
- `operating_hours` (JSON object)
- `status` (string) - Default: `offline`. Values: `online`, `offline`, `warning`, `maintenance`
- `is_active` (boolean) - Default: `true`

### Success Response (201):
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "id": 25,
    "name": "Main Branch Downtown",
    "region_id": 1,
    "branch_code": "BR-001",
    "branch_type": "Main Branch",
    "address": "123 Main Street, Riyadh 12211, Saudi Arabia",
    "coordinates": [24.7136, 46.6753],
    "contact_phone": "+966-11-123-4567",
    "manager_name": "Ahmed Al-Saud",
    "operating_hours": {...},
    "status": "online",
    "is_active": true,
    "created_at": "2025-10-29T06:32:04.906Z",
    "updated_at": "2025-10-29T06:32:04.906Z",
    "region": {
      "id": 1,
      "name": "Riyadh",
      "code": "RD"
    }
  }
}
```

---

## 2. READ - Get All Branches

### Request
```
Method: GET
URL: http://localhost:3000/api/branches
```

### Query Parameters (Optional):
- `region_id` - Filter by region ID
- `branch_type` - Filter by branch type (`Main Branch`, `Branch`, `ATM`)
- `status` - Filter by status (`online`, `offline`, `warning`, `maintenance`)
- `is_active` - Filter by active status (`true` or `false`)

### Example with Filters:
```
GET http://localhost:3000/api/branches?region_id=1&branch_type=Branch&status=online&is_active=true
```

### Success Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "King Fahd Branch",
      "region_id": 1,
      "branch_code": "RD-001",
      "branch_type": "Main Branch",
      "address": "...",
      "coordinates": [...],
      "contact_phone": "...",
      "manager_name": "...",
      "operating_hours": {...},
      "status": "online",
      "is_active": true,
      "created_at": "...",
      "updated_at": "...",
      "region": {
        "id": 1,
        "name": "Riyadh",
        "code": "RD"
      }
    }
  ]
}
```

---

## 3. READ - Get Branch by ID

### Request
```
Method: GET
URL: http://localhost:3000/api/branches/25
```

### Success Response (200):
```json
{
  "success": true,
  "data": {
    "id": 25,
    "name": "Main Branch Downtown",
    "region_id": 1,
    "branch_code": "BR-001",
    "branch_type": "Main Branch",
    "address": "123 Main Street, Riyadh 12211, Saudi Arabia",
    "coordinates": [24.7136, 46.6753],
    "contact_phone": "+966-11-123-4567",
    "manager_name": "Ahmed Al-Saud",
    "operating_hours": {...},
    "status": "online",
    "is_active": true,
    "created_at": "...",
    "updated_at": "...",
    "region": {
      "id": 1,
      "name": "Riyadh",
      "code": "RD",
      "description": "..."
    }
  }
}
```

### Error Response (404):
```json
{
  "success": false,
  "message": "Branch with ID 999 not found"
}
```

---

## 4. UPDATE Branch

### Request
```
Method: PATCH
URL: http://localhost:3000/api/branches/25

Headers:
Content-Type: application/json

Body (JSON) - Only include fields to update:
{
  "status": "warning",
  "manager_name": "Updated Manager Name",
  "contact_phone": "+966-11-999-9999",
  "operating_hours": {
    "monday": {"start": "08:00", "end": "18:00"}
  }
}
```

### Updateable Fields:
- `name`
- `region_id` (must exist if provided)
- `branch_code` (must be unique)
- `branch_type` (`Main Branch`, `Branch`, `ATM`)
- `address`
- `coordinates` (JSON array: [lat, lng])
- `contact_phone`
- `manager_name`
- `operating_hours` (JSON object)
- `status` (`online`, `offline`, `warning`, `maintenance`)
- `is_active` (boolean)

### Success Response (200):
```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": {
    "id": 25,
    "name": "Main Branch Downtown",
    "status": "warning",
    "manager_name": "Updated Manager Name",
    "contact_phone": "+966-11-999-9999",
    ...
  }
}
```

---

## 5. DELETE Branch

### Request (Soft Delete - Default)
```
Method: DELETE
URL: http://localhost:3000/api/branches/25
```

### Request (Hard Delete)
```
Method: DELETE
URL: http://localhost:3000/api/branches/25?hardDelete=true
```

### Response (Soft Delete - Sets is_active to false):
```json
{
  "success": true,
  "message": "Branch deactivated successfully",
  "data": {
    "id": 25,
    "name": "Main Branch Downtown",
    "is_active": false
  }
}
```

### Response (Hard Delete):
```json
{
  "success": true,
  "message": "Branch deleted successfully"
}
```

---

## Branch Type Values
- `Main Branch`
- `Branch`
- `ATM`

## Status Values
- `online` - Branch is operational
- `offline` - Branch is not operational
- `warning` - Branch has issues but still functioning
- `maintenance` - Branch is under maintenance

## Coordinates Format
Must be a JSON array with two numbers: `[latitude, longitude]`

Example:
```json
"coordinates": [24.7136, 46.6753]
```

## Operating Hours Format
Must be a JSON object with day names as keys:

```json
"operating_hours": {
  "monday": {"start": "09:00", "end": "17:00"},
  "tuesday": {"start": "09:00", "end": "17:00"},
  "wednesday": {"start": "09:00", "end": "17:00"},
  "thursday": {"start": "09:00", "end": "17:00"},
  "friday": {"start": "14:00", "end": "22:00"},
  "saturday": {"start": "09:00", "end": "17:00"},
  "sunday": {"start": "09:00", "end": "17:00"}
}
```

---

## Error Responses

### Validation Error (400):
```json
{
  "success": false,
  "message": "Name, region ID, branch code, branch type, address, and coordinates are required"
}
```

### Duplicate Branch Code (400):
```json
{
  "success": false,
  "message": "A branch with this branch code already exists"
}
```

### Invalid Region (400):
```json
{
  "success": false,
  "message": "Selected region does not exist"
}
```

### Invalid Status (400):
```json
{
  "success": false,
  "message": "Invalid status. Must be one of: online, offline, warning, maintenance"
}
```

### Server Error (500):
```json
{
  "success": false,
  "message": "Internal server error while creating branch"
}
```

---

## Notes

1. **Soft Delete (Default)**: By default, DELETE sets `is_active` to `false` instead of removing the record. This preserves data integrity for related NVRs and cameras.

2. **Hard Delete**: Use `?hardDelete=true` query parameter to permanently delete the branch. This will cascade delete related NVRs and cameras due to foreign key constraints.

3. **Branch Code Uniqueness**: Branch codes must be unique across all branches.

4. **Region Validation**: The `region_id` must reference an existing region.

5. **JSON Fields**: `coordinates` and `operating_hours` can be sent as JSON objects or JSON strings (will be parsed automatically).
