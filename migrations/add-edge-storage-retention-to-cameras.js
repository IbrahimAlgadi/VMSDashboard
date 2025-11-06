'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if edge_storage_retention column exists, if not add it
    const tableInfo = await queryInterface.describeTable('cameras');
    if (!tableInfo.edge_storage_retention) {
      await queryInterface.addColumn('cameras', 'edge_storage_retention', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'Edge storage retention period in days'
      });
      console.log('✅ Added edge_storage_retention column to cameras table');
    } else {
      console.log('ℹ️  edge_storage_retention column already exists');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove edge_storage_retention column
    const tableInfo = await queryInterface.describeTable('cameras');
    if (tableInfo.edge_storage_retention) {
      await queryInterface.removeColumn('cameras', 'edge_storage_retention');
      console.log('✅ Removed edge_storage_retention column from cameras table');
    }
  }
};

