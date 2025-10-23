# VMS Dashboard Database Seeders

This directory contains database seeders for populating the VMS Dashboard with realistic test data.

## Quick Start

```bash
# Install dependencies
npm install

# Create database and tables
npm run db:setup

# Seed all tables with test data
npm run db:seed
```

## Available Commands

### Main Seeding Commands
```bash
npm run db:seed              # Run all seeders
npm run db:seed:reset        # Clear and re-seed all data
npm run db:seed:list         # List all available seeders
```

### Individual Seeders
```bash
npm run db:seed:users        # Seed user accounts
npm run db:seed:regions      # Seed Saudi regions
npm run db:seed:branches     # Seed bank branches
npm run db:seed:nvrs         # Seed NVR devices
npm run db:seed:cameras      # Seed cameras
npm run db:seed:alerts       # Seed system alerts
```

## Seeder Structure

### Foundation Tables (No Dependencies)
1. **users** - System users with different roles
2. **regions** - Saudi Arabian regions
3. **system-settings** - Application configuration
4. **compliance-requirements** - Regulatory requirements

### Geographic Hierarchy
5. **branches** - Bank branches in each region

### Device Hierarchy
6. **nvrs** - Network Video Recorders
7. **nvr-storage** - Storage tracking for NVRs
8. **cameras** - Surveillance cameras
9. **camera-uptime** - Camera status tracking

### Monitoring & Analytics
10. **compliance-results** - Compliance check results
11. **alerts** - System alerts and notifications
12. **security-events** - Security incidents
13. **analytics-data** - Performance metrics
14. **reports** - Generated reports

## Test Data Overview

### Users (13 accounts)
- **Admins**: admin, sa_admin
- **Operators**: operator1, operator2, riyadh_ops, jeddah_ops
- **Technicians**: tech1, tech2, field_tech
- **Viewers**: viewer1, security_mgr, branch_mgr
- **Inactive**: inactive_user

### Geographic Coverage
- **5 Regions**: Riyadh, Jeddah, Dammam, Mecca, Medina
- **~30 Branches**: Realistic Saudi bank branches and ATMs
- **Branch Types**: Main Branch, Branch, ATM

### Device Infrastructure
- **~40 NVRs**: Various manufacturers (Hikvision, Dahua, Uniview, Axis)
- **~200 Cameras**: Mixed resolutions (2MP-8MP), different manufacturers
- **Storage**: 2TB-48TB capacity per NVR
- **Realistic Status**: Most online, some with warnings/errors

### Monitoring Data
- **~150 Alerts**: Historical and active system alerts
- **Compliance**: 22 regulatory requirements with check results
- **Uptime Tracking**: Real-time camera status monitoring
- **Security Events**: Various security scenarios

## Data Characteristics

### Realistic Saudi Context
- Arabic names and locations
- Saudi phone number formats
- Regional IP addressing schemes
- Local business hours and patterns

### Device Authenticity
- Real manufacturer models and specifications
- Proper naming conventions (NVR-RD-001, CAM-JD-002-01)
- Realistic technical specifications
- Appropriate capacity planning

### Monitoring Scenarios
- Various alert types and severities
- Historical trends and patterns
- Compliance pass/fail scenarios
- Security incident examples

## Development Workflow

### Initial Setup
```bash
npm run db:setup     # Create database
npm run db:seed      # Populate with data
```

### During Development
```bash
npm run db:seed:reset    # Fresh data
npm run db:seed:alerts   # Refresh specific table
```

### Production Considerations
- Never run seeders in production
- Use environment variables to prevent accidental seeding
- Backup real data before any seeding operations

## Customization

### Adding New Seeders
1. Create new seeder file: `##-table-name.js`
2. Follow existing seeder pattern
3. Update `seeders/index.js` with new seeder
4. Add npm script in `package.json`

### Modifying Data
- Edit seeder files to adjust data volumes
- Update `utils/helpers.js` for new data generation functions
- Modify `utils/db.js` for database operations

## Troubleshooting

### Common Issues
```bash
# Foreign key errors
npm run db:seed:list  # Check seeder order

# Connection errors  
npm run db:check      # Verify database connection

# Permission errors
# Check database user permissions
```

### Data Volumes
- **Small Dataset**: ~500 total records
- **Development**: Good for testing and development
- **Performance**: Optimized for quick seeding (<30 seconds)

## File Structure
```
seeders/
├── index.js                    # Main seeder runner
├── utils/
│   ├── db.js                  # Database utilities
│   └── helpers.js             # Data generation helpers
├── 01-users.js                # User accounts
├── 02-regions.js              # Geographic regions
├── 03-branches.js             # Bank branches  
├── 04-nvrs.js                 # NVR devices
├── 05-nvr-storage.js          # Storage tracking
├── 06-cameras.js              # Camera devices
├── 07-camera-uptime.js        # Camera status
├── 08-compliance-requirements.js # Compliance rules
├── 09-compliance-results.js   # Compliance results
├── 10-alerts.js               # System alerts
├── 11-security-events.js      # Security incidents
├── 12-analytics-data.js       # Performance data
├── 13-reports.js              # Generated reports
└── 14-system-settings.js      # System config
```
