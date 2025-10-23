const { generateTimestamps, saudiData, randomChoice, randomDecimal } = require('./utils/helpers');

class BranchesSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // First, get region IDs from database
    const regionsResult = await this.db.query('SELECT id, name, code FROM regions ORDER BY id');
    const regions = regionsResult.rows;

    if (regions.length === 0) {
      throw new Error('No regions found. Please run regions seeder first.');
    }

    const branches = [];
    let branchCounter = 1;

    for (const region of regions) {
      const branchNames = saudiData.branchNames[region.name];
      
      if (!branchNames) {
        console.warn(`No branch names found for region: ${region.name}`);
        continue;
      }

      // Create branches for this region
      for (let i = 0; i < branchNames.length; i++) {
        const branchName = branchNames[i];
        const branchCode = `${region.code}-${String(branchCounter).padStart(3, '0')}`;
        
        // Determine branch type based on name and size
        let branchType;
        if (branchName.includes('King') || branchName.includes('Main') || i === 0) {
          branchType = 'Main Branch';
        } else if (branchName.includes('ATM') || Math.random() < 0.3) {
          branchType = 'ATM';
        } else {
          branchType = 'Branch';
        }

        // Generate coordinates near the region center with some variance
        const baseCoords = saudiData.regions.find(r => r.name === region.name).coordinates;
        const lat = baseCoords[0] + randomDecimal(-0.1, 0.1, 4);
        const lng = baseCoords[1] + randomDecimal(-0.1, 0.1, 4);

        // Generate status (most should be online)
        let status;
        const rand = Math.random();
        if (rand < 0.8) status = 'online';
        else if (rand < 0.9) status = 'warning';
        else if (rand < 0.95) status = 'maintenance';
        else status = 'offline';

        const branch = {
          region_id: region.id,
          name: `${branchName} Branch`,
          branch_code: branchCode,
          branch_type: branchType,
          address: this.generateAddress(region.name, branchName),
          coordinates: JSON.stringify([lat, lng]),
          status: status,
          ...generateTimestamps(90)
        };

        branches.push(branch);
        branchCounter++;
      }
    }

    const result = await this.db.insertBatch('branches', branches, 'DO NOTHING');
    
    // Generate summary by region
    const regionSummary = {};
    branches.forEach(branch => {
      const regionName = regions.find(r => r.id === branch.region_id).name;
      regionSummary[regionName] = (regionSummary[regionName] || 0) + 1;
    });

    const summaryStr = Object.entries(regionSummary)
      .map(([region, count]) => `${region}(${count})`)
      .join(', ');
    
    return {
      summary: `Created ${result.length} branches across regions: ${summaryStr}`
    };
  }

  generateAddress(regionName, branchName) {
    const streetTypes = ['Street', 'Road', 'Avenue', 'Boulevard'];
    const streetType = randomChoice(streetTypes);
    
    const addresses = {
      'Riyadh': [
        `${branchName} ${streetType}, Al Olaya District, Riyadh 12213, Saudi Arabia`,
        `${branchName} ${streetType}, King Fahd District, Riyadh 12271, Saudi Arabia`,
        `${branchName} ${streetType}, Al Malaz District, Riyadh 12837, Saudi Arabia`,
        `${branchName} ${streetType}, Diplomatic Quarter, Riyadh 12022, Saudi Arabia`
      ],
      'Jeddah': [
        `${branchName} ${streetType}, Al Hamra District, Jeddah 23323, Saudi Arabia`,
        `${branchName} ${streetType}, Corniche District, Jeddah 23212, Saudi Arabia`,
        `${branchName} ${streetType}, Al Balad, Jeddah 23233, Saudi Arabia`,
        `${branchName} ${streetType}, Al Rawdah District, Jeddah 23432, Saudi Arabia`
      ],
      'Dammam': [
        `${branchName} ${streetType}, Al Faisaliyah District, Dammam 32245, Saudi Arabia`,
        `${branchName} ${streetType}, Corniche District, Dammam 32411, Saudi Arabia`,
        `${branchName} ${streetType}, Al Shatea District, Dammam 32273, Saudi Arabia`,
        `${branchName} ${streetType}, City Center, Dammam 32223, Saudi Arabia`
      ],
      'Mecca': [
        `${branchName} ${streetType}, Ajyad District, Mecca 24231, Saudi Arabia`,
        `${branchName} ${streetType}, Al Aziziyah District, Mecca 24243, Saudi Arabia`,
        `${branchName} ${streetType}, Al Misfalah District, Mecca 24235, Saudi Arabia`
      ],
      'Medina': [
        `${branchName} ${streetType}, Al Haram District, Medina 42311, Saudi Arabia`,
        `${branchName} ${streetType}, Quba District, Medina 42319, Saudi Arabia`,
        `${branchName} ${streetType}, Al Aqeeq District, Medina 42317, Saudi Arabia`
      ]
    };

    const regionAddresses = addresses[regionName];
    return regionAddresses ? randomChoice(regionAddresses) : `${branchName} ${streetType}, ${regionName}, Saudi Arabia`;
  }
}

module.exports = BranchesSeeder;
