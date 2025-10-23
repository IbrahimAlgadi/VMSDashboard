const { 
  generateTimestamps, 
  randomChoice, 
  randomInt, 
  randomIP, 
  generateUptime, 
  generateDeviceName,
  deviceData 
} = require('./utils/helpers');

class NvrsSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // Get branches and regions from database
    const branchesResult = await this.db.query(`
      SELECT b.id, b.name, b.branch_code, b.branch_type, r.code as region_code 
      FROM branches b 
      JOIN regions r ON b.region_id = r.id 
      ORDER BY b.id
    `);
    const branches = branchesResult.rows;

    if (branches.length === 0) {
      throw new Error('No branches found. Please run branches seeder first.');
    }

    const nvrs = [];
    let nvrCounter = 1;

    for (const branch of branches) {
      // Determine number of NVRs per branch based on branch type
      let nvrCount;
      switch (branch.branch_type) {
        case 'Main Branch':
          nvrCount = randomInt(2, 4); // Main branches have 2-4 NVRs
          break;
        case 'Branch':
          nvrCount = randomInt(1, 2); // Regular branches have 1-2 NVRs
          break;
        case 'ATM':
          nvrCount = 1; // ATM locations have 1 NVR
          break;
        default:
          nvrCount = 1;
      }

      // Create NVRs for this branch
      for (let i = 0; i < nvrCount; i++) {
        const deviceName = generateDeviceName('nvr', branch.region_code, branch.id, i + 1);
        
        // Generate realistic device specifications
        const manufacturer = randomChoice(deviceData.nvrManufacturers);
        const model = randomChoice(deviceData.nvrModels);
        
        // Processor specs based on manufacturer
        const processors = {
          'Hikvision': ['Intel i7-8700', 'Intel i5-8400', 'ARM Cortex-A73'],
          'Dahua': ['Intel i7-9700', 'Intel i5-9400', 'ARM Cortex-A76'],
          'Uniview': ['Intel i5-8500', 'Intel i3-8100', 'ARM Cortex-A72'],
          'Axis': ['Intel Xeon E3-1275', 'Intel i7-8700', 'Intel i5-8400']
        };
        
        const ramOptions = ['8GB DDR4', '16GB DDR4', '32GB DDR4', '64GB DDR4'];
        
        // Generate version numbers
        const majorVersion = randomInt(4, 5);
        const minorVersion = randomInt(0, 9);
        const patchVersion = randomInt(0, 9);
        const securosVersion = `v${majorVersion}.${minorVersion}.${patchVersion}`;
        
        // Determine max cameras based on model
        const maxCameras = model.includes('16') ? 16 : 
                          model.includes('32') ? 32 : 
                          model.includes('64') ? 64 : 
                          randomChoice([8, 16, 24, 32]);
        
        // Current cameras (usually 60-90% of max capacity)
        const utilizationRate = Math.random() * 0.3 + 0.6; // 60-90%
        const currentCameras = Math.floor(maxCameras * utilizationRate);
        
        // Generate IP address based on region
        const ipSubnet = {
          'RD': '192.168.1', // Riyadh
          'JD': '192.168.2', // Jeddah  
          'DM': '192.168.3', // Dammam
          'MC': '192.168.4', // Mecca
          'MD': '192.168.5'  // Medina
        };
        
        const subnet = ipSubnet[branch.region_code] || '192.168.1';
        const ipAddress = `${subnet}.${randomInt(100, 199)}`;
        
        // Generate status (most should be online)
        let status;
        const rand = Math.random();
        if (rand < 0.85) status = 'online';
        else if (rand < 0.95) status = 'warning';
        else if (rand < 0.98) status = 'error';
        else status = 'offline';
        
        // Generate maintenance dates
        const installationDate = new Date(Date.now() - randomInt(30, 1095) * 24 * 60 * 60 * 1000); // 1 month to 3 years ago
        const maintenancePeriodDays = randomChoice([30, 60, 90, 120]); // Maintenance every 1-4 months
        
        const lastMaintenanceDate = new Date(installationDate.getTime() + randomInt(1, 200) * 24 * 60 * 60 * 1000);
        const nextMaintenanceDate = new Date(lastMaintenanceDate.getTime() + maintenancePeriodDays * 24 * 60 * 60 * 1000);
        
        // Warranty typically 2-5 years from installation
        const warrantyYears = randomChoice([2, 3, 5]);
        const warrantyExpiry = new Date(installationDate.getTime() + warrantyYears * 365 * 24 * 60 * 60 * 1000);
        
        const nvr = {
          branch_id: branch.id,
          device_name: deviceName,
          processor: randomChoice(processors[manufacturer] || processors['Hikvision']),
          ram: randomChoice(ramOptions),
          device_id: `${manufacturer.substring(0, 3).toUpperCase()}-${randomInt(100000, 999999)}`,
          product_id: model,
          system_type: `${manufacturer} NVR System`,
          securos_version: securosVersion,
          ip_address: ipAddress,
          max_cameras: maxCameras,
          current_cameras: currentCameras,
          status: status,
          uptime_percent: generateUptime(),
          last_seen: status === 'offline' ? 
            new Date(Date.now() - randomInt(1, 24) * 60 * 60 * 1000).toISOString() : 
            new Date(Date.now() - randomInt(1, 30) * 60 * 1000).toISOString(),
          installation_date: installationDate.toISOString().split('T')[0],
          previous_maintenance_date: lastMaintenanceDate.toISOString().split('T')[0],
          maintenance_period_days: maintenancePeriodDays,
          next_maintenance_date: nextMaintenanceDate.toISOString().split('T')[0],
          warranty_expiry: warrantyExpiry.toISOString().split('T')[0],
          is_active: true,
          ...generateTimestamps(60)
        };

        nvrs.push(nvr);
        nvrCounter++;
      }
    }

    const result = await this.db.insertBatch('nvrs', nvrs, 'DO NOTHING');
    
    // Generate summary statistics
    const stats = {
      total: nvrs.length,
      online: nvrs.filter(n => n.status === 'online').length,
      warning: nvrs.filter(n => n.status === 'warning').length,
      error: nvrs.filter(n => n.status === 'error').length,
      offline: nvrs.filter(n => n.status === 'offline').length,
      manufacturers: {}
    };

    // Count by manufacturer
    nvrs.forEach(nvr => {
      const manufacturer = deviceData.nvrManufacturers.find(m => 
        nvr.processor && nvr.processor.includes(m)
      ) || 'Unknown';
      stats.manufacturers[manufacturer] = (stats.manufacturers[manufacturer] || 0) + 1;
    });

    const manufacturerSummary = Object.entries(stats.manufacturers)
      .map(([mfg, count]) => `${mfg}(${count})`)
      .join(', ');
    
    return {
      summary: `Created ${result.length} NVRs - Status: online(${stats.online}), warning(${stats.warning}), error(${stats.error}), offline(${stats.offline}) - Manufacturers: ${manufacturerSummary}`
    };
  }
}

module.exports = NvrsSeeder;
