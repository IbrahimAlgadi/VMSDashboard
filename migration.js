const { Client } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vms_dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

// Create database client
const client = new Client(dbConfig);

// SQL statements for table creation
const tableStatements = {
  // Core User Management
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) CHECK (role IN ('admin', 'operator', 'viewer', 'technician')) NOT NULL,
      department VARCHAR(50),
      phone VARCHAR(20),
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Geographic Organization
  regions: `
    CREATE TABLE IF NOT EXISTS regions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      code VARCHAR(10) UNIQUE NOT NULL,
      description TEXT,
      coordinates JSON,
      timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  branches: `
    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      region_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      branch_code VARCHAR(20) UNIQUE NOT NULL,
      branch_type VARCHAR(20) CHECK (branch_type IN ('Main Branch', 'Branch', 'ATM')) NOT NULL,
      address TEXT NOT NULL,
      coordinates JSON NOT NULL,
      contact_phone VARCHAR(20),
      manager_name VARCHAR(100),
      operating_hours JSON,
      status VARCHAR(20) CHECK (status IN ('online', 'offline', 'warning', 'maintenance')) DEFAULT 'offline',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE
    );
  `,

  // Device Management
  nvrs: `
    CREATE TABLE IF NOT EXISTS nvrs (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER NOT NULL,
      device_name VARCHAR(50) UNIQUE NOT NULL,
      hostname VARCHAR(50) UNIQUE NOT NULL,
      processor VARCHAR(100),
      ram VARCHAR(50),
      device_id VARCHAR(100),
      product_id VARCHAR(100),
      system_type VARCHAR(50),
      securos_version VARCHAR(20),
      ip_address VARCHAR(15) NOT NULL,
      max_cameras INTEGER DEFAULT 16,
      current_cameras INTEGER DEFAULT 0,
      status VARCHAR(20) CHECK (status IN ('online', 'offline', 'warning', 'error')) DEFAULT 'offline',
      uptime_percent DECIMAL(5,2) DEFAULT 0.00,
      last_seen TIMESTAMP,
      installation_date DATE,
      previous_maintenance_date DATE,
      maintenance_period_days INTEGER DEFAULT 90,
      next_maintenance_date DATE,
      warranty_expiry DATE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );
  `,

  nvr_storage: `
    CREATE TABLE IF NOT EXISTS nvr_storage (
      id SERIAL PRIMARY KEY,
      nvr_id INTEGER NOT NULL,
      storage_total_gb INTEGER NOT NULL,
      storage_used_gb INTEGER DEFAULT 0,
      storage_percent DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (nvr_id) REFERENCES nvrs(id) ON DELETE CASCADE
    );
  `,

  cameras: `
    CREATE TABLE IF NOT EXISTS cameras (
      id SERIAL PRIMARY KEY,
      nvr_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      name VARCHAR(50) UNIQUE NOT NULL,
      position VARCHAR(100) NOT NULL,
      ip_address VARCHAR(15) NOT NULL,
      model VARCHAR(100),
      manufacturer VARCHAR(50),
      resolution VARCHAR(20),
      fps INTEGER DEFAULT 25,
      bitrate INTEGER,
      edge_storage_size INTEGER,
      edge_storage_retention INTEGER,
      status VARCHAR(20) CHECK (status IN ('online', 'offline', 'warning', 'error')) DEFAULT 'offline',
      uptime_percent DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (nvr_id) REFERENCES nvrs(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );
  `,

  camera_uptime: `
    CREATE TABLE IF NOT EXISTS camera_uptime (
      id SERIAL PRIMARY KEY,
      camera_id INTEGER NOT NULL,
      status VARCHAR(20) CHECK (status IN ('online', 'offline', 'warning', 'error')) DEFAULT 'offline',
      last_seen TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
    );
  `,

  // Alert Management
  alerts: `
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER,
      acknowledged_by INTEGER,
      resolved_by INTEGER,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) CHECK (type IN ('camera_offline', 'nvr_offline', 'storage_warning', 'motion_detected', 'network_issue', 'maintenance', 'security', 'system_error', 'power_issue', 'firmware_update')) NOT NULL,
      severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')) NOT NULL,
      source_type VARCHAR(20) CHECK (source_type IN ('camera', 'nvr', 'system', 'network', 'user')) NOT NULL,
      source_id INTEGER,
      status VARCHAR(20) CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')) DEFAULT 'active',
      acknowledged_at TIMESTAMP,
      resolved_at TIMESTAMP,
      resolution_notes TEXT,
      auto_resolve BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `,

  // Compliance Management
  compliance_requirements: `
    CREATE TABLE IF NOT EXISTS compliance_requirements (
      id SERIAL PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(20) CHECK (category IN ('camera', 'nvr', 'storage', 'network', 'security', 'maintenance')) NOT NULL,
      applies_to VARCHAR(20) CHECK (applies_to IN ('camera', 'nvr', 'both')) NOT NULL,
      required_value TEXT,
      check_method VARCHAR(20) CHECK (check_method IN ('automatic', 'manual', 'hybrid')) DEFAULT 'automatic',
      check_frequency VARCHAR(20) CHECK (check_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'monthly')) DEFAULT 'daily',
      severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  compliance_results: `
    CREATE TABLE IF NOT EXISTS compliance_results (
      id SERIAL PRIMARY KEY,
      requirement_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      device_type VARCHAR(20) CHECK (device_type IN ('camera', 'nvr')) NOT NULL,
      device_id INTEGER NOT NULL,
      status VARCHAR(20) CHECK (status IN ('passed', 'failed', 'warning', 'not_applicable')) NOT NULL,
      actual_value TEXT,
      expected_value TEXT,
      details TEXT,
      check_timestamp TIMESTAMP NOT NULL,
      next_check TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requirement_id) REFERENCES compliance_requirements(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );
  `,

  // Security Monitoring
  security_events: `
    CREATE TABLE IF NOT EXISTS security_events (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER,
      assigned_to INTEGER,
      resolved_by INTEGER,
      event_type VARCHAR(50) CHECK (event_type IN ('weak_password', 'http_access', 'rtsp_tls', 'srtp_encryption', 'firmware_outdated', 'audit_logging', 'unauthorized_access', 'tls_missing', 'audit_disabled')) NOT NULL,
      severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low')) NOT NULL,
      device_type VARCHAR(20) CHECK (device_type IN ('camera', 'nvr', 'system')) NOT NULL,
      device_id INTEGER,
      device_name VARCHAR(100),
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      source_ip VARCHAR(15),
      detection_method VARCHAR(20) CHECK (detection_method IN ('automatic', 'manual', 'external')) DEFAULT 'automatic',
      status VARCHAR(20) CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive')) DEFAULT 'active',
      resolved_at TIMESTAMP,
      resolution_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `,

  // Analytics and Reporting
  analytics_data: `
    CREATE TABLE IF NOT EXISTS analytics_data (
      id SERIAL PRIMARY KEY,
      metric_type VARCHAR(20) CHECK (metric_type IN ('uptime', 'alerts', 'storage', 'network', 'performance', 'compliance')) NOT NULL,
      metric_name VARCHAR(100) NOT NULL,
      entity_type VARCHAR(20) CHECK (entity_type IN ('system', 'region', 'branch', 'nvr', 'camera')) NOT NULL,
      entity_id INTEGER,
      value DECIMAL(10,4) NOT NULL,
      unit VARCHAR(20),
      timestamp TIMESTAMP NOT NULL,
      aggregation_period VARCHAR(20) CHECK (aggregation_period IN ('minute', 'hour', 'day', 'week', 'month')) DEFAULT 'hour',
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  reports: `
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      generated_by INTEGER NOT NULL,
      name VARCHAR(200) NOT NULL,
      type VARCHAR(20) CHECK (type IN ('uptime', 'compliance', 'security', 'analytics', 'maintenance', 'custom')) NOT NULL,
      format VARCHAR(10) CHECK (format IN ('pdf', 'excel', 'csv', 'json')) DEFAULT 'pdf',
      parameters JSON,
      date_range_start DATE NOT NULL,
      date_range_end DATE NOT NULL,
      status VARCHAR(20) CHECK (status IN ('pending', 'generating', 'completed', 'failed')) DEFAULT 'pending',
      file_path VARCHAR(500),
      file_size INTEGER,
      generated_at TIMESTAMP,
      expires_at TIMESTAMP,
      download_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `,

  // System Configuration
  system_settings: `
    CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      key VARCHAR(100) NOT NULL,
      value TEXT,
      data_type VARCHAR(20) CHECK (data_type IN ('string', 'integer', 'float', 'boolean', 'json')) DEFAULT 'string',
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, key)
    );
  `
};

// Create indexes for better performance
const indexStatements = [
  // Branches indexes
  'CREATE INDEX IF NOT EXISTS idx_branches_region_id ON branches(region_id);',
  'CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);',
  
  // NVRs indexes
  'CREATE INDEX IF NOT EXISTS idx_nvrs_branch_id ON nvrs(branch_id);',
  'CREATE INDEX IF NOT EXISTS idx_nvrs_hostname ON nvrs(hostname);',
  'CREATE INDEX IF NOT EXISTS idx_nvrs_ip_address ON nvrs(ip_address);',
  'CREATE INDEX IF NOT EXISTS idx_nvrs_status ON nvrs(status);',
  'CREATE INDEX IF NOT EXISTS idx_nvrs_last_seen ON nvrs(last_seen);',
  
  // Cameras indexes
  'CREATE INDEX IF NOT EXISTS idx_cameras_nvr_id ON cameras(nvr_id);',
  'CREATE INDEX IF NOT EXISTS idx_cameras_branch_id ON cameras(branch_id);',
  'CREATE INDEX IF NOT EXISTS idx_cameras_ip_address ON cameras(ip_address);',
  'CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);',
  
  // Camera uptime indexes
  'CREATE INDEX IF NOT EXISTS idx_camera_uptime_camera_id ON camera_uptime(camera_id);',
  'CREATE INDEX IF NOT EXISTS idx_camera_uptime_status ON camera_uptime(status);',
  
  // Alerts indexes
  'CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);',
  'CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);',
  'CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);',
  'CREATE INDEX IF NOT EXISTS idx_alerts_branch_id ON alerts(branch_id);',
  'CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);',
  'CREATE INDEX IF NOT EXISTS idx_alerts_source ON alerts(source_type, source_id);',
  
  // Compliance indexes
  'CREATE INDEX IF NOT EXISTS idx_compliance_requirements_code ON compliance_requirements(code);',
  'CREATE INDEX IF NOT EXISTS idx_compliance_requirements_category ON compliance_requirements(category);',
  'CREATE INDEX IF NOT EXISTS idx_compliance_results_requirement_id ON compliance_results(requirement_id);',
  'CREATE INDEX IF NOT EXISTS idx_compliance_results_branch_id ON compliance_results(branch_id);',
  'CREATE INDEX IF NOT EXISTS idx_compliance_results_device ON compliance_results(device_type, device_id);',
  'CREATE INDEX IF NOT EXISTS idx_compliance_results_status ON compliance_results(status);',
  'CREATE INDEX IF NOT EXISTS idx_compliance_results_check_timestamp ON compliance_results(check_timestamp);',
  
  // Security events indexes
  'CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);',
  'CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);',
  'CREATE INDEX IF NOT EXISTS idx_security_events_device ON security_events(device_type, device_id);',
  'CREATE INDEX IF NOT EXISTS idx_security_events_branch_id ON security_events(branch_id);',
  'CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status);',
  'CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);',
  
  // Analytics indexes
  'CREATE INDEX IF NOT EXISTS idx_analytics_metric ON analytics_data(metric_type, metric_name);',
  'CREATE INDEX IF NOT EXISTS idx_analytics_entity ON analytics_data(entity_type, entity_id);',
  'CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_data(timestamp);',
  'CREATE INDEX IF NOT EXISTS idx_analytics_aggregation ON analytics_data(aggregation_period);',
  
  // Reports indexes
  'CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);',
  'CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);',
  'CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);',
  'CREATE INDEX IF NOT EXISTS idx_reports_date_range ON reports(date_range_start, date_range_end);',
  'CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);',
  
  // System settings indexes
  'CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);'
];

// Create triggers for updated_at timestamps
const triggerStatements = [
  `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `,
  
  // Apply triggers to tables with updated_at columns
  'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_nvrs_updated_at BEFORE UPDATE ON nvrs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_nvr_storage_updated_at BEFORE UPDATE ON nvr_storage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_cameras_updated_at BEFORE UPDATE ON cameras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_camera_uptime_updated_at BEFORE UPDATE ON camera_uptime FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_compliance_requirements_updated_at BEFORE UPDATE ON compliance_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_compliance_results_updated_at BEFORE UPDATE ON compliance_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_security_events_updated_at BEFORE UPDATE ON security_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
  'CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'
];

// Function to run migration
async function runMigration() {
  const migrationClient = new Client(dbConfig);
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await migrationClient.connect();
    console.log('✅ Connected to database successfully');

    console.log('\n📋 Starting database migration...');
    
    // Create tables in dependency order
    const tableOrder = [
      'users',
      'regions', 
      'branches',
      'nvrs',
      'nvr_storage',
      'cameras',
      'camera_uptime',
      'alerts',
      'compliance_requirements',
      'compliance_results',
      'security_events',
      'analytics_data',
      'reports',
      'system_settings'
    ];

    // Create each table
    for (const tableName of tableOrder) {
      console.log(`📋 Creating table: ${tableName}`);
      await migrationClient.query(tableStatements[tableName]);
      console.log(`✅ Table ${tableName} created successfully`);
    }

    console.log('\n🔍 Creating database indexes...');
    // Create indexes
    for (const indexSQL of indexStatements) {
      await migrationClient.query(indexSQL);
    }
    console.log('✅ All indexes created successfully');

    console.log('\n⚡ Creating triggers...');
    // Create triggers
    for (const triggerSQL of triggerStatements) {
      await migrationClient.query(triggerSQL);
    }
    console.log('✅ All triggers created successfully');

    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n📊 Database Schema Summary:');
    console.log('- 14 tables created');
    console.log('- Foreign key relationships established');
    console.log('- Indexes created for performance optimization');
    console.log('- Auto-update triggers for timestamp fields');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await migrationClient.end();
    console.log('🔌 Database connection closed');
  }
}

// Function to create database
async function createDatabase() {
  // Create a client connected to the default postgres database
  const defaultDbConfig = {
    ...dbConfig,
    database: 'postgres' // Connect to default postgres database
  };
  const defaultClient = new Client(defaultDbConfig);

  try {
    console.log('🔌 Connecting to PostgreSQL server...');
    await defaultClient.connect();
    console.log('✅ Connected to PostgreSQL server successfully');

    // Check if database exists
    const dbName = dbConfig.database;
    console.log(`🔍 Checking if database '${dbName}' exists...`);
    
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1;
    `;
    const result = await defaultClient.query(checkDbQuery, [dbName]);

    if (result.rows.length > 0) {
      console.log(`✅ Database '${dbName}' already exists`);
    } else {
      console.log(`📋 Creating database '${dbName}'...`);
      
      // Create the database
      const createDbQuery = `CREATE DATABASE "${dbName}";`;
      await defaultClient.query(createDbQuery);
      
      console.log(`✅ Database '${dbName}' created successfully`);
    }

    console.log('\n🎉 Database creation completed!');
    console.log(`📋 Database: ${dbName}`);
    console.log(`🔗 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 User: ${dbConfig.user}`);
    
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    
    if (error.code === '42P04') {
      console.log('✅ Database already exists');
    } else {
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  } finally {
    await defaultClient.end();
    console.log('🔌 Database connection closed');
  }
}

// Function to check database connection
async function checkConnection() {
  const checkClient = new Client(dbConfig);
  try {
    console.log('🔍 Testing database connection...');
    await checkClient.connect();
    const result = await checkClient.query('SELECT version()');
    console.log('✅ Database connection successful');
    console.log('📋 PostgreSQL Version:', result.rows[0].version);
    await checkClient.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your database configuration in .env file');
    
    if (error.code === '3D000') {
      console.log('💡 Tip: The database might not exist. Try running: node migration.js create');
    }
    
    process.exit(1);
  }
}

// Function to drop all tables (useful for development)
async function dropAllTables() {
  const dropClient = new Client(dbConfig);
  try {
    console.log('⚠️  WARNING: This will drop all tables and data!');
    console.log('🔌 Connecting to database...');
    await dropClient.connect();

    const dropOrder = [
      'analytics_data',
      'reports', 
      'security_events',
      'compliance_results',
      'compliance_requirements',
      'alerts',
      'camera_uptime',
      'cameras',
      'nvr_storage',
      'nvrs',
      'branches',
      'regions',
      'system_settings',
      'users'
    ];

    for (const tableName of dropOrder) {
      console.log(`🗑️  Dropping table: ${tableName}`);
      await dropClient.query(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
    }

    console.log('✅ All tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error.message);
  } finally {
    await dropClient.end();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'create':
    createDatabase();
    break;
  case 'check':
    checkConnection();
    break;
  case 'migrate':
    runMigration();
    break;
  case 'drop':
    dropAllTables();
    break;
  case 'reset':
    console.log('🔄 Resetting database...');
    dropAllTables().then(() => {
      setTimeout(() => runMigration(), 1000);
    });
    break;
  case 'setup':
    console.log('🚀 Setting up database from scratch...');
    createDatabase().then(() => {
      setTimeout(() => runMigration(), 1000);
    });
    break;
  default:
    console.log('📋 VMS Dashboard Database Migration Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node migration.js create  - Create database (if not exists)');
    console.log('  node migration.js check   - Test database connection');
    console.log('  node migration.js migrate - Run migration (create tables)');
    console.log('  node migration.js setup   - Create database and run migration');
    console.log('  node migration.js drop    - Drop all tables');
    console.log('  node migration.js reset   - Drop and recreate all tables');
    console.log('');
    console.log('Typical workflow:');
    console.log('  1. node migration.js create  (create database)');
    console.log('  2. node migration.js migrate (create tables)');
    console.log('  OR');
    console.log('  1. node migration.js setup   (create database + tables)');
    console.log('');
    console.log('Environment Variables (.env file):');
    console.log('  DB_HOST=localhost');
    console.log('  DB_PORT=5432');
    console.log('  DB_NAME=vms_dashboard');
    console.log('  DB_USER=postgres');
    console.log('  DB_PASSWORD=your_password');
}
