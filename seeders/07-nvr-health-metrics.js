const { NVRHealthMetrics, NVR } = require('../src/models');

async function seedNVRHealthMetrics() {
  try {
    console.log('🌱 Seeding NVR Health Metrics...');

    // Get all NVRs to create health metrics for
    const nvrs = await NVR.findAll({
      where: { is_active: true },
      attributes: ['id', 'device_name', 'status']
    });

    console.log(`Found ${nvrs.length} NVRs to seed health metrics for`);

    const healthMetricsData = [];

    for (const nvr of nvrs) {
      // Generate realistic health metrics based on NVR status
      const isOnline = nvr.status === 'online';
      const isWarning = nvr.status === 'warning';
      
      // Base metrics
      let cpuUsage = Math.random() * 30 + 20; // 20-50%
      let memoryUsage = Math.random() * 40 + 30; // 30-70%
      let diskIO = Math.random() * 20 + 10; // 10-30%
      let healthScore = 85 + Math.random() * 15; // 85-100
      
      // Adjust based on status
      if (!isOnline) {
        cpuUsage = 0;
        memoryUsage = 0;
        diskIO = 0;
        healthScore = 0;
      } else if (isWarning) {
        cpuUsage += 20; // Higher CPU usage
        memoryUsage += 15; // Higher memory usage
        healthScore -= 20; // Lower health score
      }

      // Storage metrics (realistic for NVR systems)
      const storageTotal = Math.random() * 4000 + 1000; // 1TB to 5TB
      const storageUsed = storageTotal * (Math.random() * 0.6 + 0.2); // 20-80% used

      // Network metrics
      const bandwidthIn = Math.random() * 50 + 20; // 20-70 Mbps
      const bandwidthOut = Math.random() * 30 + 10; // 10-40 Mbps
      const packetsSent = Math.floor(Math.random() * 100000 + 50000);
      const packetsReceived = Math.floor(Math.random() * 120000 + 60000);

      // Connection and recording status
      const connectionStatus = isOnline ? 
        (Math.random() > 0.9 ? 'unstable' : 'connected') : 'disconnected';
      const recordingStatus = isOnline ? 
        (Math.random() > 0.1 ? 'recording' : 'stopped') : 'stopped';

      // Additional metrics
      const temperature = Math.random() * 20 + 35; // 35-55°C
      const fanSpeed = Math.floor(Math.random() * 2000 + 1000); // 1000-3000 RPM
      const powerConsumption = Math.random() * 50 + 80; // 80-130W

      healthMetricsData.push({
        nvr_id: nvr.id,
        cpu_usage_percent: parseFloat(cpuUsage.toFixed(2)),
        memory_usage_percent: parseFloat(memoryUsage.toFixed(2)),
        disk_io_percent: parseFloat(diskIO.toFixed(2)),
        storage_used_gb: parseFloat(storageUsed.toFixed(2)),
        storage_total_gb: parseFloat(storageTotal.toFixed(2)),
        bandwidth_in_mbps: parseFloat(bandwidthIn.toFixed(2)),
        bandwidth_out_mbps: parseFloat(bandwidthOut.toFixed(2)),
        packets_sent: packetsSent,
        packets_received: packetsReceived,
        connection_status: connectionStatus,
        recording_status: recordingStatus,
        last_health_check: new Date(),
        health_score: Math.floor(healthScore),
        temperature_celsius: parseFloat(temperature.toFixed(2)),
        fan_speed_rpm: fanSpeed,
        power_consumption_watts: parseFloat(powerConsumption.toFixed(2)),
        is_active: true
      });
    }

    // Insert health metrics data
    await NVRHealthMetrics.bulkCreate(healthMetricsData, {
      ignoreDuplicates: true
    });

    console.log(`✅ Successfully seeded ${healthMetricsData.length} NVR health metrics records`);

    // Show sample data
    const sampleMetrics = await NVRHealthMetrics.findOne({
      include: [{
        model: NVR,
        as: 'nvr',
        attributes: ['device_name', 'status']
      }],
      order: [['created_at', 'DESC']]
    });

    if (sampleMetrics) {
      console.log('📊 Sample health metrics:');
      console.log(`   NVR: ${sampleMetrics.nvr.device_name}`);
      console.log(`   CPU: ${sampleMetrics.cpu_usage_percent}%`);
      console.log(`   Memory: ${sampleMetrics.memory_usage_percent}%`);
      console.log(`   Storage: ${sampleMetrics.storage_used_gb}GB / ${sampleMetrics.storage_total_gb}GB`);
      console.log(`   Health Score: ${sampleMetrics.health_score}/100`);
      console.log(`   Connection: ${sampleMetrics.connection_status}`);
      console.log(`   Recording: ${sampleMetrics.recording_status}`);
    }

  } catch (error) {
    console.error('❌ Error seeding NVR health metrics:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedNVRHealthMetrics()
    .then(() => {
      console.log('🎉 NVR Health Metrics seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedNVRHealthMetrics;
