const { sequelize } = require('./src/models');

async function runMigration() {
  try {
    // Get migration file from command line arguments
    const migrationFile = process.argv[2];
    if (!migrationFile) {
      console.error('❌ Please provide a migration file path');
      console.log('Usage: node run-migration.js <migration-file>');
      process.exit(1);
    }

    console.log(`🔄 Running migration: ${migrationFile}...`);
    
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const migration = require(`./${migrationFile}`);
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('✅ Migration completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
