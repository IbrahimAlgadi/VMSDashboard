const { 
  generateTimestamps, 
  randomChoice, 
  randomInt 
} = require('./utils/helpers');

class CameraUptimeSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // Get cameras from database
    const camerasResult = await this.db.query(`
      SELECT c.id, c.name, c.uptime_percent, n.status as nvr_status
      FROM cameras c 
      JOIN nvrs n ON c.nvr_id = n.id
      ORDER BY c.id
    `);
    const cameras = camerasResult.rows;

    if (cameras.length === 0) {
      throw new Error('No cameras found. Please run cameras seeder first.');
    }

    const uptimeRecords = [];

    for (const camera of cameras) {
      // Determine camera status based on uptime and NVR status
      let status;
      let lastSeen;

      if (camera.nvr_status === 'offline') {
        // If NVR is offline, camera is definitely offline
        status = 'offline';
        lastSeen = new Date(Date.now() - randomInt(1, 48) * 60 * 60 * 1000); // 1-48 hours ago
      } else {
        // Determine status based on uptime percentage
        if (camera.uptime_percent >= 99.5) {
          status = 'online';
          lastSeen = new Date(Date.now() - randomInt(1, 10) * 60 * 1000); // 1-10 minutes ago
        } else if (camera.uptime_percent >= 98.0) {
          const rand = Math.random();
          if (rand < 0.8) {
            status = 'online';
            lastSeen = new Date(Date.now() - randomInt(1, 15) * 60 * 1000); // 1-15 minutes ago
          } else {
            status = 'warning';
            lastSeen = new Date(Date.now() - randomInt(15, 60) * 60 * 1000); // 15-60 minutes ago
          }
        } else if (camera.uptime_percent >= 95.0) {
          const rand = Math.random();
          if (rand < 0.5) {
            status = 'warning';
            lastSeen = new Date(Date.now() - randomInt(30, 120) * 60 * 1000); // 30-120 minutes ago
          } else if (rand < 0.8) {
            status = 'error';
            lastSeen = new Date(Date.now() - randomInt(2, 8) * 60 * 60 * 1000); // 2-8 hours ago
          } else {
            status = 'offline';
            lastSeen = new Date(Date.now() - randomInt(4, 24) * 60 * 60 * 1000); // 4-24 hours ago
          }
        } else {
          // Poor uptime cameras
          const rand = Math.random();
          if (rand < 0.3) {
            status = 'warning';
            lastSeen = new Date(Date.now() - randomInt(60, 180) * 60 * 1000); // 1-3 hours ago
          } else if (rand < 0.6) {
            status = 'error';
            lastSeen = new Date(Date.now() - randomInt(4, 12) * 60 * 60 * 1000); // 4-12 hours ago
          } else {
            status = 'offline';
            lastSeen = new Date(Date.now() - randomInt(12, 72) * 60 * 60 * 1000); // 12-72 hours ago
          }
        }
      }

      const uptimeRecord = {
        camera_id: camera.id,
        status: status,
        last_seen: lastSeen.toISOString(),
        ...generateTimestamps(5) // Uptime data is very recent
      };

      uptimeRecords.push(uptimeRecord);
    }

    const result = await this.db.insertBatch('camera_uptime', uptimeRecords, 'DO NOTHING');
    
    // Generate summary statistics
    const stats = {
      total: uptimeRecords.length,
      online: uptimeRecords.filter(r => r.status === 'online').length,
      warning: uptimeRecords.filter(r => r.status === 'warning').length,
      error: uptimeRecords.filter(r => r.status === 'error').length,
      offline: uptimeRecords.filter(r => r.status === 'offline').length
    };

    const onlinePercentage = ((stats.online / stats.total) * 100).toFixed(1);
    
    return {
      summary: `Created ${result.length} camera uptime records - Status: online(${stats.online}), warning(${stats.warning}), error(${stats.error}), offline(${stats.offline}) - ${onlinePercentage}% online`
    };
  }
}

module.exports = CameraUptimeSeeder;
