const { 
  generateTimestamps, 
  randomChoice, 
  randomInt, 
  randomDecimal,
  generateUptime, 
  generateDeviceName,
  deviceData 
} = require('./utils/helpers');

class CamerasSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // Get NVRs with their branch and region information
    const nvrsResult = await this.db.query(`
      SELECT n.id, n.device_name, n.branch_id, n.max_cameras, n.current_cameras, n.status,
             b.branch_code, b.branch_type, r.code as region_code
      FROM nvrs n 
      JOIN branches b ON n.branch_id = b.id
      JOIN regions r ON b.region_id = r.id
      ORDER BY n.id
    `);
    const nvrs = nvrsResult.rows;

    if (nvrs.length === 0) {
      throw new Error('No NVRs found. Please run nvrs seeder first.');
    }

    const cameras = [];
    let cameraCounter = 1;

    for (const nvr of nvrs) {
      const numCameras = nvr.current_cameras;
      
      // Generate cameras for this NVR
      for (let i = 0; i < numCameras; i++) {
        const channelNumber = i + 1;
        const deviceName = `${nvr.device_name.replace('NVR', 'CAM')}-${String(channelNumber).padStart(2, '0')}`;
        
        // Select manufacturer and model
        const manufacturer = randomChoice(deviceData.cameraManufacturers);
        const model = randomChoice(deviceData.cameraModels);
        const resolution = randomChoice(deviceData.resolutions);
        
        // Generate position based on branch type and camera number
        let position;
        if (nvr.branch_type === 'ATM') {
          const atmPositions = ['ATM Entrance', 'ATM Interior', 'Cash Dispenser'];
          position = atmPositions[i % atmPositions.length];
        } else {
          position = randomChoice(deviceData.positions);
        }
        
        // Generate IP address in same subnet as NVR
        const nvrIP = nvr.device_name.includes('RD') ? '192.168.1' :
                     nvr.device_name.includes('JD') ? '192.168.2' : 
                     nvr.device_name.includes('DM') ? '192.168.3' :
                     nvr.device_name.includes('MC') ? '192.168.4' :
                     nvr.device_name.includes('MD') ? '192.168.5' : '192.168.1';
        
        const ipAddress = `${nvrIP}.${randomInt(200, 254)}`;
        
        // FPS based on resolution and usage
        let fps;
        if (resolution.includes('8MP') || resolution.includes('4K')) {
          fps = randomChoice([15, 20, 25]); // Lower FPS for high res
        } else if (resolution.includes('5MP') || resolution.includes('4MP')) {
          fps = randomChoice([20, 25, 30]); // Medium FPS for medium res
        } else {
          fps = randomChoice([25, 30]); // Higher FPS for lower res
        }
        
        // Bitrate estimation based on resolution and FPS
        const resolutionMultiplier = resolution.includes('8MP') ? 8 :
                                   resolution.includes('5MP') ? 5 :
                                   resolution.includes('4MP') ? 4 : 2;
        const bitrate = Math.floor(resolutionMultiplier * fps * randomDecimal(0.8, 1.2)); // Mbps
        
        // Edge storage (some cameras have local storage)
        const edgeStorageSize = Math.random() < 0.3 ? randomChoice([32, 64, 128, 256]) : null; // GB
        
        // Camera status influenced by NVR status
        let status;
        if (nvr.status === 'offline') {
          status = 'offline';
        } else if (nvr.status === 'error') {
          status = randomChoice(['error', 'offline', 'warning']);
        } else {
          const rand = Math.random();
          if (rand < 0.82) status = 'online';
          else if (rand < 0.94) status = 'warning';
          else if (rand < 0.98) status = 'error';
          else status = 'offline';
        }

        const camera = {
          nvr_id: nvr.id,
          branch_id: nvr.branch_id,
          name: deviceName,
          position: position,
          ip_address: ipAddress,
          model: model,
          manufacturer: manufacturer,
          resolution: resolution,
          fps: fps,
          bitrate: bitrate * 1000, // Convert to Kbps
          edge_storage_size: edgeStorageSize,
          uptime_percent: generateUptime(),
          ...generateTimestamps(45)
        };

        cameras.push(camera);
        cameraCounter++;
      }
    }

    const result = await this.db.insertBatch('cameras', cameras, 'DO NOTHING');
    
    // Generate summary statistics
    const stats = {
      total: cameras.length,
      manufacturers: {},
      resolutions: {},
      positions: {}
    };

    // Count by various categories
    cameras.forEach(camera => {
      // Manufacturers
      const mfg = camera.manufacturer || 'Unknown';
      stats.manufacturers[mfg] = (stats.manufacturers[mfg] || 0) + 1;
      
      // Resolutions
      const res = camera.resolution || 'Unknown';
      stats.resolutions[res] = (stats.resolutions[res] || 0) + 1;
      
      // Positions (top 3)
      const pos = camera.position || 'Unknown';
      stats.positions[pos] = (stats.positions[pos] || 0) + 1;
    });

    // Format summaries
    const manufacturerSummary = Object.entries(stats.manufacturers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mfg, count]) => `${mfg}(${count})`)
      .join(', ');

    const resolutionSummary = Object.entries(stats.resolutions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([res, count]) => `${res}(${count})`)
      .join(', ');
    
    return {
      summary: `Created ${result.length} cameras - Top manufacturers: ${manufacturerSummary} - Top resolutions: ${resolutionSummary}`
    };
  }
}

module.exports = CamerasSeeder;
