const { generateTimestamps, saudiData } = require('./utils/helpers');

class RegionsSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    const regions = saudiData.regions.map((region, index) => ({
      name: region.name,
      code: region.code,
      description: `${region.name} Region - Major metropolitan area with multiple bank branches and ATM locations`,
      coordinates: JSON.stringify(region.coordinates),
      timezone: 'Asia/Riyadh',
      is_active: true,
      ...generateTimestamps(120) // Created within last 120 days
    }));

    const result = await this.db.insertBatch('regions', regions, 'DO NOTHING');
    
    return {
      summary: `Created ${result.length} regions: ${regions.map(r => r.name).join(', ')}`
    };
  }
}

module.exports = RegionsSeeder;
