'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create enum type for camera status
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_cameras_status AS ENUM ('online', 'offline', 'warning', 'maintenance');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Check if status column exists, if not add it
    const tableInfo = await queryInterface.describeTable('cameras');
    if (!tableInfo.status) {
      await queryInterface.addColumn('cameras', 'status', {
        type: Sequelize.ENUM('online', 'offline', 'warning', 'maintenance'),
        defaultValue: 'offline',
        allowNull: false
      });
    }

    // Update existing cameras based on uptime_percent
    await queryInterface.sequelize.query(`
      UPDATE cameras 
      SET status = (
        CASE 
          WHEN uptime_percent >= 95 THEN 'online'::enum_cameras_status
          WHEN uptime_percent >= 50 THEN 'warning'::enum_cameras_status
          ELSE 'offline'::enum_cameras_status
        END
      )
      WHERE status = 'offline'::enum_cameras_status;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove status column
    await queryInterface.removeColumn('cameras', 'status');
    
    // Drop enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_cameras_status;
    `);
  }
};
