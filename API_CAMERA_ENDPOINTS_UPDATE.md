# Camera API Endpoints - Updated Structure

## Problem Solved

**Original Issue**: The error occurred because the client was passing `"Camera 1"` (camera name) to an endpoint expecting a numeric ID, causing PostgreSQL error:
```
invalid input syntax for type integer: "Camera 1"
```

**Solution**: Created separate, explicit endpoints to eliminate confusion between numeric IDs and camera names.

## New API Endpoints Structure

### GET Endpoints

| Method | Endpoint | Description | Parameter Type | Example |
|--------|----------|-------------|----------------|---------|
| GET | `/api/cameras` | Get all cameras | - | `/api/cameras` |
| GET | `/api/cameras/by-id/:id` | Get camera by numeric ID | Integer | `/api/cameras/by-id/1` |
| GET | `/api/cameras/by-name/:name` | Get camera by name | String | `/api/cameras/by-name/Camera%201` |

### POST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cameras` | Create new camera |

### PATCH (Update) Endpoints

| Method | Endpoint | Description | Parameter Type | Example |
|--------|----------|-------------|----------------|---------|
| PATCH | `/api/cameras/by-id/:id` | Update camera by numeric ID | Integer | `/api/cameras/by-id/1` |
| PATCH | `/api/cameras/by-name/:name` | Update camera by name | String | `/api/cameras/by-name/Camera%201` |

### DELETE Endpoints

| Method | Endpoint | Description | Parameter Type | Example |
|--------|----------|-------------|----------------|---------|
| DELETE | `/api/cameras/by-id/:id` | Delete camera by numeric ID | Integer | `/api/cameras/by-id/1` |
| DELETE | `/api/cameras/by-name/:name` | Delete camera by name | String | `/api/cameras/by-name/Camera%201` |

## Validation Added

- **Numeric ID Validation**: All `by-id` endpoints now validate that the ID parameter is a positive integer
- **Clear Error Messages**: When validation fails, the API provides helpful error messages suggesting the correct endpoint

### Example Error Response
```json
{
  "success": false,
  "message": "Invalid camera ID format. Expected numeric ID, got: \"Camera 1\". Use /api/cameras/by-name/Camera%201 if you meant to search by name."
}
```

## Usage Examples

### Correct Usage by ID
```bash
# Get camera with ID 1
GET /api/cameras/by-id/1

# Update camera with ID 1
PATCH /api/cameras/by-id/1
{
  "status": "maintenance"
}

# Delete camera with ID 1
DELETE /api/cameras/by-id/1
```

### Correct Usage by Name
```bash
# Get camera named "Camera 1"
GET /api/cameras/by-name/Camera%201

# Update camera named "Camera 1"
PATCH /api/cameras/by-name/Camera%201
{
  "status": "online"
}

# Delete camera named "Camera 1"
DELETE /api/cameras/by-name/Camera%201
```

## Implementation Details

### Controller Methods Added/Updated
- `getCameraById()` - Added numeric ID validation
- `getCameraByName()` - New method for getting camera by name
- `updateCameraById()` - Renamed from `updateCamera()`, added validation
- `updateCameraByName()` - Existing method
- `deleteCameraById()` - Renamed from `deleteCamera()`, added validation  
- `deleteCameraByName()` - New method for deleting camera by name

### Validation Utility Added
- `isValidNumericId()` - Validates that a value is a positive integer

## Benefits

1. **Clear API Intent**: Endpoints explicitly indicate whether they expect ID or name
2. **Type Safety**: Numeric validation prevents type confusion errors
3. **Better Error Messages**: Users get helpful suggestions when using wrong endpoint
4. **Consistency**: All CRUD operations available for both ID and name access patterns
5. **Backward Compatibility**: Existing name-based endpoints still work

## Database Records Reference

For the provided sample data:
- Camera with ID `1` has name `"Camera 1"`
- Camera with ID `2` has name `"Camera 2"`

Now clients can safely use:
- `/api/cameras/by-id/1` to access the first camera by its numeric ID
- `/api/cameras/by-name/Camera%201` to access the first camera by its name
