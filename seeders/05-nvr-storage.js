const { 
  generateTimestamps, 
  randomInt, 
  generateStorageUsage, 
  randomChoice 
} = require('./utils/helpers');

class NvrStorageSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // Get NVRs from database
    const nvrsResult = await this.db.query(`
      SELECT n.id, n.device_name, n.max_cameras, n.current_cameras, n.status
      FROM nvrs n 
      ORDER BY n.id
    `);
    const nvrs = nvrsResult.rows;

    if (nvrs.length === 0) {
      throw new Error('No NVRs found. Please run nvrs seeder first.');
    }

    const storageRecords = [];

    for (const nvr of nvrs) {
      // Determine storage capacity based on camera capacity and type
      let totalStorageGB;
      
      if (nvr.max_cameras <= 8) {
        totalStorageGB = randomChoice([2000, 4000, 6000]); // 2TB, 4TB, 6TB for small systems
      } else if (nvr.max_cameras <= 16) {
        totalStorageGB = randomChoice([4000, 8000, 12000]); // 4TB, 8TB, 12TB for medium systems
      } else if (nvr.max_cameras <= 32) {
        totalStorageGB = randomChoice([8000, 16000, 24000]); // 8TB, 16TB, 24TB for large systems
      } else {
        totalStorageGB = randomChoice([16000, 32000, 48000]); // 16TB, 32TB, 48TB for enterprise systems
      }

      // Calculate used storage based on various factors
      let usagePercentage = generateStorageUsage();
      
      // Adjust usage based on camera utilization
      const cameraUtilization = nvr.current_cameras / nvr.max_cameras;
      usagePercentage = Math.min(95, usagePercentage * (0.5 + cameraUtilization * 0.5));
      
      // Offline NVRs might have stale data
      if (nvr.status === 'offline') {
        // Offline systems may have outdated storage info
        usagePercentage = randomInt(30, 80);
      }
      
      const usedStorageGB = Math.floor((totalStorageGB * usagePercentage) / 100);
      const finalPercentage = (usedStorageGB / totalStorageGB) * 100;

      const storageRecord = {
        nvr_id: nvr.id,
        storage_total_gb: totalStorageGB,
        storage_used_gb: usedStorageGB,
        storage_percent: parseFloat(finalPercentage.toFixed(2)),
        ...generateTimestamps(30) // Storage data is typically updated recently
      };

      storageRecords.push(storageRecord);
    }

    const result = await this.db.insertBatch('nvr_storage', storageRecords, 'DO NOTHING');
    
    // Generate summary statistics
    const stats = {
      total: storageRecords.length,
      totalCapacityTB: Math.round(storageRecords.reduce((sum, record) => sum + record.storage_total_gb, 0) / 1000),
      totalUsedTB: Math.round(storageRecords.reduce((sum, record) => sum + record.storage_used_gb, 0) / 1000),
      criticalUsage: storageRecords.filter(r => r.storage_percent >= 90).length,
      warningUsage: storageRecords.filter(r => r.storage_percent >= 80 && r.storage_percent < 90).length,
      normalUsage: storageRecords.filter(r => r.storage_percent < 80).length
    };

    const averageUsage = (storageRecords.reduce((sum, record) => sum + record.storage_percent, 0) / storageRecords.length).toFixed(1);

    return {
      summary: `Created ${result.length} storage records - Total: ${stats.totalCapacityTB}TB, Used: ${stats.totalUsedTB}TB (${averageUsage}% avg) - Usage levels: normal(${stats.normalUsage}), warning(${stats.warningUsage}), critical(${stats.criticalUsage})`
    };
  }
}

module.exports = NvrStorageSeeder;
