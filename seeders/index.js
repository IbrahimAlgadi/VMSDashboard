#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const DatabaseSeeder = require('./utils/db');

class MainSeeder {
  constructor() {
    this.db = new DatabaseSeeder();
    this.seeders = [
      { name: 'users', file: '01-users.js', description: 'System users and authentication' },
      { name: 'regions', file: '02-regions.js', description: 'Geographic regions' },
      { name: 'system-settings', file: '14-system-settings.js', description: 'System configuration' },
      { name: 'compliance-requirements', file: '08-compliance-requirements.js', description: 'Compliance requirements' },
      { name: 'branches', file: '03-branches.js', description: 'Bank branches' },
      { name: 'nvrs', file: '04-nvrs.js', description: 'NVR devices' },
      { name: 'nvr-storage', file: '05-nvr-storage.js', description: 'NVR storage tracking' },
      { name: 'cameras', file: '06-cameras.js', description: 'Camera devices' },
      { name: 'camera-uptime', file: '07-camera-uptime.js', description: 'Camera uptime tracking' },
      { name: 'compliance-results', file: '09-compliance-results.js', description: 'Compliance check results' },
      { name: 'alerts', file: '10-alerts.js', description: 'System alerts' },
      { name: 'security-events', file: '11-security-events.js', description: 'Security incidents' },
      { name: 'analytics-data', file: '12-analytics-data.js', description: 'Performance analytics' },
      { name: 'reports', file: '13-reports.js', description: 'Generated reports' }
    ];
  }

  async runAll(options = {}) {
    const { reset = false, verbose = false } = options;
    
    try {
      console.log('🌱 Starting VMS Dashboard Database Seeding...\n');
      await this.db.connect();

      if (reset) {
        console.log('🧹 Clearing existing data...');
        await this.clearAllTables();
        console.log('✅ All tables cleared\n');
      }

      let totalSeeded = 0;
      const startTime = Date.now();

      for (const seeder of this.seeders) {
        await this.runSeeder(seeder, verbose);
        totalSeeded++;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('\n🎉 Seeding completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - ${totalSeeded} seeders executed`);
      console.log(`   - ${duration}s total time`);
      console.log(`   - Database: ${process.env.DB_NAME || 'vms_dashboard'}`);
      
      await this.printTableCounts();

    } catch (error) {
      console.error('\n❌ Seeding failed:', error.message);
      throw error;
    } finally {
      await this.db.disconnect();
    }
  }

  async runSeeder(seeder, verbose = false) {
    const seederPath = path.join(__dirname, seeder.file);
    
    if (!fs.existsSync(seederPath)) {
      console.log(`⚠️  Skipping ${seeder.name}: file not found`);
      return;
    }

    try {
      if (verbose) {
        console.log(`🌱 Running ${seeder.name}: ${seeder.description}`);
      } else {
        process.stdout.write(`🌱 ${seeder.name.padEnd(20)} `);
      }

      const SeederClass = require(seederPath);
      const seederInstance = new SeederClass(this.db);
      
      const startTime = Date.now();
      const result = await seederInstance.run();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (verbose) {
        console.log(`✅ ${seeder.name} completed in ${duration}s`);
        if (result && result.summary) {
          console.log(`   ${result.summary}`);
        }
      } else {
        console.log(`✅ ${duration}s`);
      }

    } catch (error) {
      console.error(`❌ ${seeder.name} failed:`, error.message);
      throw error;
    }
  }

  async runSpecific(seederName, options = {}) {
    const seeder = this.seeders.find(s => s.name === seederName);
    if (!seeder) {
      throw new Error(`Seeder '${seederName}' not found`);
    }

    try {
      await this.db.connect();
      
      if (options.reset) {
        console.log(`🧹 Clearing ${seederName} table...`);
        await this.clearSeederTable(seeder);
      }

      await this.runSeeder(seeder, true);
      
    } finally {
      await this.db.disconnect();
    }
  }

  async clearAllTables() {
    // Clear in reverse dependency order
    const clearOrder = [...this.seeders].reverse();
    
    for (const seeder of clearOrder) {
      await this.clearSeederTable(seeder);
    }
  }

  async clearSeederTable(seeder) {
    const tableName = this.getTableName(seeder.name);
    try {
      await this.db.clearTable(tableName);
    } catch (error) {
      console.log(`⚠️  Could not clear ${tableName}: ${error.message}`);
    }
  }

  getTableName(seederName) {
    // Convert seeder name to table name
    return seederName.replace(/-/g, '_');
  }

  async printTableCounts() {
    console.log('\n📋 Table Record Counts:');
    
    for (const seeder of this.seeders) {
      const tableName = this.getTableName(seeder.name);
      try {
        const count = await this.db.getTableCount(tableName);
        console.log(`   ${tableName.padEnd(25)} ${count.toString().padStart(6)} records`);
      } catch (error) {
        console.log(`   ${tableName.padEnd(25)} ${'-'.padStart(6)} (error)`);
      }
    }
  }

  listSeeders() {
    console.log('📋 Available Seeders:\n');
    this.seeders.forEach((seeder, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${seeder.name.padEnd(20)} - ${seeder.description}`);
    });
    console.log('\nUsage:');
    console.log('  npm run db:seed                    - Run all seeders');
    console.log('  npm run db:seed:reset              - Clear and re-seed all');
    console.log('  npm run db:seed:specific <name>    - Run specific seeder');
    console.log('  npm run db:seed:list               - List all seeders');
  }
}

// Command line interface
async function main() {
  const seeder = new MainSeeder();
  const command = process.argv[2];
  const seederName = process.argv[3];
  
  try {
    switch (command) {
      case 'all':
        await seeder.runAll({ verbose: true });
        break;
        
      case 'reset':
        await seeder.runAll({ reset: true, verbose: true });
        break;
        
      case 'specific':
        if (!seederName) {
          console.error('❌ Please specify seeder name');
          process.exit(1);
        }
        await seeder.runSpecific(seederName, { reset: true });
        break;
        
      case 'list':
        seeder.listSeeders();
        break;
        
      default:
        // Default: run all seeders without reset
        await seeder.runAll();
        break;
    }
  } catch (error) {
    console.error('\n💥 Seeding process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MainSeeder;
