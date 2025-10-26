const { sequelize } = require('./src/models');
const migration = require('./migrations/add-status-to-cameras');

async function runMigration() {
  try {
    console.log('🔄 Running migration: add-status-to-cameras...');
    
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('✅ Migration completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
