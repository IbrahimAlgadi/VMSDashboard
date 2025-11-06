# VMS Dashboard Initialization API

## Overview

The Initialization API allows bulk setup and configuration of the entire VMS system through a single API call. This is perfect for:

- **System Deployment**: Setting up new installations
- **Configuration Management**: Bulk updates and migrations  
- **Site Replication**: Copying configurations across locations
- **Backup/Restore**: System state management

## API Endpoints

### 1. Initialize System
```http
POST /api/initialize
Content-Type: application/json
```

Bulk creates/updates regions, branches, NVRs, cameras and their configurations.

### 2. Get Schema
```http
GET /api/initialize/schema
```

Returns the complete JSON schema and example payload.

### 3. System Status
```http
GET /api/initialize/status  
```

Returns current system status and statistics.

## JSON Structure

The API accepts a hierarchical structure:

```javascript
{
  "region": {
    "name": "Riyadh Region",
    "code": "RD", 
    "description": "Main region covering Riyadh area",
    "coordinates": {"lat": 24.7136, "lng": 46.6753},
    "timezone": "Asia/Riyadh",
    "branches": [
      {
        "name": "Main Branch Riyadh",
        "branch_code": "RD-001",
        "branch_type": "Main Branch",
        "address": "King Fahd Road, Riyadh",
        "coordinates": {"lat": 24.7136, "lng": 46.6753},
        "contact_phone": "+966-11-XXXXXX",
        "manager_name": "Ahmad Al-Saudi",
        "operating_hours": {
          "weekdays": "08:00-17:00",
          "weekend": "closed"
        },
        "nvrs": [
          {
            "device_name": "NVR-RD-001-01",
            "hostname": "DESKTOP-T7MNQIA",
            "processor": "Intel i7-8700",
            "ram": "32GB DDR4", 
            "device_id": "HIK-123456",
            "product_id": "DS-7616NI-K2",
            "system_type": "Hikvision NVR System",
            "securos_version": "v4.3.1",
            "ip_address": "192.168.1.100",
            "max_cameras": 16,
            "installation_date": "2024-01-15",
            "maintenance_period_days": 90,
            "warranty_expiry": "2026-01-15",
            "storage": {
              "storage_total_gb": 8000,
              "storage_used_gb": 2400
            },
            "cameras": [
              {
                "name": "CAM-RD-001-01",
                "position": "Main Entrance", 
                "ip_address": "192.168.1.101",
                "model": "DS-2CD2142FWD-I",
                "manufacturer": "Hikvision",
                "resolution": "4MP",
                "fps": 25,
                "bitrate": 6144,
                "edge_storage_size": 128,
                "status": "online"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## Field Specifications

### Region Fields
| Field | Type | Required | Format | Description |
|-------|------|----------|--------|-------------|
| `name` | string | ✅ | - | Region display name |
| `code` | string | ✅ | `^[A-Z]{2,5}$` | Unique region code (2-5 uppercase letters) |
| `description` | string | ❌ | - | Optional description |
| `coordinates` | object | ❌ | `{lat: number, lng: number}` | GPS coordinates |
| `timezone` | string | ❌ | - | Default: "Asia/Riyadh" |

### Branch Fields  
| Field | Type | Required | Format | Description |
|-------|------|----------|--------|-------------|
| `name` | string | ✅ | - | Branch display name |
| `branch_code` | string | ✅ | `^[A-Z]{2,5}-\\d{3}$` | Unique code (e.g., RD-001) |
| `branch_type` | string | ❌ | "Main Branch", "Branch", "ATM" | Branch classification |
| `address` | string | ✅ | - | Physical address |
| `coordinates` | object | ❌ | `{lat: number, lng: number}` | GPS coordinates |
| `contact_phone` | string | ❌ | - | Contact number |
| `manager_name` | string | ❌ | - | Branch manager |
| `operating_hours` | object | ❌ | - | Operating schedule |

### NVR Fields
| Field | Type | Required | Format | Description |
|-------|------|----------|--------|-------------|  
| `device_name` | string | ✅ | `^[A-Z]+-[A-Z0-9]+-\\d{3}-\\d{2}$` | Unique device identifier |
| `hostname` | string | ✅ | `^[A-Z0-9-]+$` | **Remote hostname (like DESKTOP-T7MNQIA)** |
| `ip_address` | string | ✅ | IPv4 format | NVR network address |
| `processor` | string | ❌ | - | CPU specification |
| `ram` | string | ❌ | - | Memory specification |
| `device_id` | string | ❌ | - | Hardware device ID |
| `product_id` | string | ❌ | - | Product model |
| `system_type` | string | ❌ | - | System description |
| `securos_version` | string | ❌ | - | Firmware version |
| `max_cameras` | integer | ❌ | 1-64 | Maximum camera capacity |
| `installation_date` | string | ❌ | YYYY-MM-DD | Installation date |
| `maintenance_period_days` | integer | ❌ | ≥7 | Maintenance interval |
| `warranty_expiry` | string | ❌ | YYYY-MM-DD | Warranty end date |

### Storage Configuration
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `storage_total_gb` | integer | ❌ | Total storage capacity |
| `storage_used_gb` | integer | ❌ | Used storage space |

### Camera Fields
| Field | Type | Required | Format | Description |
|-------|------|----------|--------|-------------|
| `name` | string | ✅ | `^CAM-[A-Z0-9]+-\\d{3}-\\d{2}$` | Unique camera identifier |
| `position` | string | ✅ | - | Camera location description |
| `ip_address` | string | ✅ | IPv4 format | Camera network address |
| `model` | string | ❌ | - | Camera model |
| `manufacturer` | string | ❌ | - | Camera manufacturer |
| `resolution` | string | ❌ | - | Video resolution (e.g., "4MP") |
| `fps` | integer | ❌ | 1-60 | Frames per second |
| `bitrate` | integer | ❌ | ≥0 | Video bitrate in kbps |
| `edge_storage_size` | integer | ❌ | ≥0 | Edge storage in GB |
| `status` | string | ❌ | "online", "offline", "warning", "error" | Camera status |

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "System initialization completed successfully",
  "summary": {
    "regions": 1,
    "branches": 2,
    "nvrs": 4,
    "cameras": 32,
    "storage_configs": 4,
    "errors": []
  },
  "region": {
    "id": 1,
    "name": "Riyadh Region", 
    "code": "RD"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Region code must be 2-5 uppercase letters",
    "Branch 1: branch_code must match pattern XX-000"
  ]
}
```

## Usage Examples

### Complete Site Setup
```bash
curl -X POST http://localhost:3000/api/initialize \
  -H "Content-Type: application/json" \
  -d @complete-site-config.json
```

### Single Branch Deployment
```bash 
curl -X POST http://localhost:3000/api/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "region": {
      "name": "Eastern Region",
      "code": "ER",
      "branches": [{
        "name": "Dammam Branch",
        "branch_code": "ER-001", 
        "address": "King Abdulaziz Road, Dammam",
        "nvrs": [{
          "device_name": "NVR-ER-001-01",
          "hostname": "SERVER-DMM001",
          "ip_address": "192.168.5.100",
          "cameras": [{
            "name": "CAM-ER-001-01",
            "position": "Front Door",
            "ip_address": "192.168.5.101"
          }]
        }]
      }]
    }
  }'
```

### Get Schema
```bash
curl -X GET http://localhost:3000/api/initialize/schema
```

### Check System Status
```bash
curl -X GET http://localhost:3000/api/initialize/status
```

## Key Features

### 🔄 **Transaction Safety**
- All operations wrapped in database transactions
- Automatic rollback on any failure
- Partial success handling with detailed error reporting

### 🔍 **Conflict Resolution**
- Uses `ON CONFLICT` to update existing records
- Maintains data integrity with unique constraints
- Hostname uniqueness validation

### 📊 **Comprehensive Validation**
- JSON schema validation
- Business rule enforcement
- Format validation (IP addresses, device names, etc.)

### ⚡ **Performance Optimized**
- Bulk insert operations where possible
- Efficient database queries
- Proper indexing on key fields

### 🛡️ **Error Handling**
- Detailed validation error messages
- Transaction rollback on failure
- Comprehensive logging

## Integration Notes

### Database Requirements
- PostgreSQL with proper schema (run migration first)
- Required tables: regions, branches, nvrs, cameras, nvr_storage, camera_uptime
- Proper foreign key constraints and indexes

### Environment Variables
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vms_dashboard
DB_USER=postgres
DB_PASSWORD=your_password
```

### Dependencies
- Node.js with Express
- pg (PostgreSQL client)
- Existing VMS Dashboard database schema

## Security Considerations

- **Input Validation**: All inputs validated before processing
- **SQL Injection**: Uses parameterized queries
- **Transaction Safety**: Database consistency maintained
- **Error Disclosure**: Detailed errors for debugging (consider limiting in production)

## Troubleshooting

### Common Issues

1. **Validation Errors**: Check field formats and required fields
2. **Duplicate Keys**: Ensure unique codes and hostnames
3. **Database Connection**: Verify PostgreSQL connection and credentials
4. **Foreign Key Violations**: Ensure proper data relationships

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development`

## Next Steps

After successful initialization:
1. Verify data through existing API endpoints
2. Update frontend interfaces to display new data  
3. Configure monitoring and alerts
4. Set up backup procedures

---

This API provides a powerful foundation for VMS system management and deployment automation!
