'use strict';

const { 
  generateTimestamps, 
  randomChoice, 
  randomInt, 
  randomDecimal
} = require('./utils/helpers');

class CameraHealthMetricsSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    console.log('🌱 Seeding Camera Health Metrics...');

    // Get all cameras
    const camerasResult = await this.db.query(`
      SELECT id, name, status, ip_address 
      FROM cameras 
      ORDER BY id
    `);
    const cameras = camerasResult.rows;

    if (cameras.length === 0) {
      console.log('No cameras found to seed health metrics for. Skipping seeding.');
      return { summary: 'No cameras found' };
    }

    console.log(`Found ${cameras.length} cameras to seed health metrics for`);

    const healthMetrics = [];
    const now = new Date();

    for (const camera of cameras) {
      const isOnline = camera.status === 'online';
      
      // Generate realistic health metrics based on camera status
      const pingMs = parseFloat((Math.random() * (isOnline ? 20 : 100) + (isOnline ? 5 : 50)).toFixed(2));
      const packetLoss = parseFloat((Math.random() * (isOnline ? 2 : 10) + (isOnline ? 0 : 5)).toFixed(2));
      const bandwidthMbps = parseFloat((Math.random() * (isOnline ? 5 : 1) + (isOnline ? 2 : 0.5)).toFixed(2));
      const bitrateKbps = isOnline ? Math.floor(Math.random() * 2000) + 2048 : 0; // 2048-4048 kbps if online
      const frameDropPercent = parseFloat((Math.random() * (isOnline ? 1 : 5) + (isOnline ? 0 : 2)).toFixed(2));
      
      // Quality score based on other metrics
      let qualityScore = 0;
      if (isOnline) {
        qualityScore = Math.floor(Math.random() * 20) + 80; // 80-100 if online
        if (pingMs > 50) qualityScore -= 10;
        if (packetLoss > 1) qualityScore -= 15;
        if (frameDropPercent > 0.5) qualityScore -= 10;
      } else {
        qualityScore = Math.floor(Math.random() * 30) + 20; // 20-50 if offline
      }
      
      const recordingTimeDays = isOnline ? Math.floor(Math.random() * 20) + 10 : 0; // 10-30 days if online
      const spaceUsedGb = isOnline ? parseFloat((Math.random() * 200 + 50).toFixed(2)) : 0; // 50-250 GB if online
      const retentionDays = 30; // Standard retention
      const motionEventsToday = isOnline ? Math.floor(Math.random() * 50) + 10 : 0; // 10-60 events if online
      const alertsPending = isOnline ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 5) + 2; // More alerts if offline
      
      // Last reboot date (random date within last 30 days)
      const lastRebootDate = new Date();
      lastRebootDate.setDate(lastRebootDate.getDate() - Math.floor(Math.random() * 30));

      healthMetrics.push({
        camera_id: camera.id,
        ping_ms: pingMs,
        packet_loss_percent: packetLoss,
        bandwidth_mbps: bandwidthMbps,
        bitrate_kbps: bitrateKbps,
        frame_drop_percent: frameDropPercent,
        quality_score: qualityScore,
        recording_time_days: recordingTimeDays,
        space_used_gb: spaceUsedGb,
        retention_days: retentionDays,
        motion_events_today: motionEventsToday,
        alerts_pending: alertsPending,
        last_reboot_date: lastRebootDate.toISOString().split('T')[0],
        last_health_check: now,
        is_active: true,
        created_at: now,
        updated_at: now
      });
    }

    // Insert health metrics
    await this.db.bulkInsert('camera_health_metrics', healthMetrics);

    console.log(`✅ Seeded ${healthMetrics.length} camera health metrics records`);
    return { 
      summary: `Seeded ${healthMetrics.length} camera health metrics records`,
      count: healthMetrics.length
    };
  }
}

module.exports = CameraHealthMetricsSeeder;
