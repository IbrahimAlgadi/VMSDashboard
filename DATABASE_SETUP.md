# Database Setup Guide

This guide will help you set up the PostgreSQL database for the VMS Dashboard application.

## Prerequisites

1. **PostgreSQL**: Install PostgreSQL 12 or higher
2. **Node.js**: Ensure you have Node.js 16+ installed
3. **Dependencies**: Install required packages

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `pg` - PostgreSQL client for Node.js
- `dotenv` - Environment variable loader

### 2. Database Configuration

Create a `.env` file in the root directory with your database configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vms_dashboard
DB_USER=postgres
DB_PASSWORD=your_password_here

# Optional: Database SSL Configuration
DB_SSL=false

# Application Configuration
NODE_ENV=development
PORT=3000

# JWT Secret (for authentication)
JWT_SECRET=your_jwt_secret_here

# System Settings
DEFAULT_TIMEZONE=Asia/Riyadh
DEFAULT_LANGUAGE=en
```

### 3. Create Database and Run Migration

You have two options:

**Option A: Automatic Setup (Recommended)**
```bash
# Create database and tables in one command
npm run db:setup
```

**Option B: Manual Step-by-Step**
```bash
# 1. Create database (if it doesn't exist)
npm run db:create

# 2. Test database connection
npm run db:check

# 3. Create all tables
npm run db:migrate
```

## Migration Commands

The migration script supports several commands:

| Command | Description |
|---------|-------------|
| `npm run db:create` | Create database (if not exists) |
| `npm run db:check` | Test database connection |
| `npm run db:migrate` | Create all tables and indexes |
| `npm run db:setup` | Create database + run migration |
| `npm run db:drop` | Drop all tables (⚠️ Destructive!) |
| `npm run db:reset` | Drop and recreate all tables |

## Database Schema

The migration creates the following tables:

### Core Tables
- **users** - System users and authentication
- **regions** - Geographic regions (Riyadh, Jeddah, etc.)
- **branches** - Bank branch locations
- **nvrs** - Network Video Recorders
- **cameras** - Individual surveillance cameras

### Monitoring Tables
- **nvr_storage** - NVR storage tracking
- **camera_uptime** - Camera uptime monitoring
- **alerts** - System alerts and notifications
- **security_events** - Security incidents

### Compliance & Analytics
- **compliance_requirements** - Regulatory requirements
- **compliance_results** - Compliance check results
- **analytics_data** - Performance metrics
- **reports** - Generated reports

### System Tables
- **system_settings** - Application configuration

## Database Features

### Automatic Timestamps
All tables with `updated_at` columns have triggers that automatically update the timestamp when records are modified.

### Indexes
Performance indexes are created for:
- Foreign key relationships
- Status fields
- Timestamp columns
- Frequently queried fields

### Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints validate enum values
- Unique constraints prevent duplicates

## Troubleshooting

### Connection Issues
1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure database exists
4. Check firewall settings

### Permission Errors
```bash
# Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE vms_dashboard TO your_user;
```

### SSL Issues
If using SSL connections, add to `.env`:
```env
DB_SSL=true
```

## Sample Data

After migration, you may want to populate the database with sample data from the mock files in `data/mock/` directory.

## Migration Details

### Table Creation Order
Tables are created in dependency order to respect foreign key relationships:

1. users, regions
2. branches
3. nvrs, nvr_storage
4. cameras, camera_uptime
5. alerts, compliance_requirements
6. compliance_results, security_events
7. analytics_data, reports, system_settings

### Indexes Created
- Primary key indexes (automatic)
- Foreign key indexes for joins
- Status field indexes for filtering
- Timestamp indexes for time-based queries
- Composite indexes for complex queries

### Triggers
Automatic `updated_at` timestamp triggers for all relevant tables.

## Development Workflow

### Initial Setup
```bash
# First time setup
npm run db:setup
```

### Making Schema Changes
```bash
# After modifying migration.js
npm run db:reset
```

### Fresh Development Environment
```bash
# Clean slate
npm run db:reset
```

### Production Deployment
```bash
# Create database (if needed)
npm run db:create

# Run migration (never use reset in production!)
npm run db:migrate
```

## Production Considerations

- **Backup**: Always backup before running migrations in production
- **Downtime**: Plan for brief downtime during migration
- **Rollback**: Keep migration rollback scripts ready
- **Monitoring**: Monitor database performance after migration
- **SSL**: Enable SSL for production databases
- **Connection Pooling**: Consider connection pooling for high-traffic applications

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database users
- Enable SSL for production databases
- Regularly update database software
- Monitor for security events in the `security_events` table
