const { NVR, Branch } = require('../models');
const MOCK_DATA = require('../config/constants');

class MapController {
  // GET /map
  async showMap(req, res) {
    try {
      const nvrs = await NVR.findAll({
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'coordinates', 'address']
        }],
        where: { is_active: true },
        attributes: ['id', 'name', 'status', 'ip_address']
      }).catch(() => []);

      const nvrList = nvrs.length > 0 ? nvrs : MOCK_DATA.nvrs;

      res.render('map', {
        title: 'Location Map',
        currentPage: 'map',
        nvrs: nvrList
      });
    } catch (error) {
      console.error('Error loading map data:', error);
      res.render('map', {
        title: 'Location Map',
        currentPage: 'map',
        nvrs: MOCK_DATA.nvrs
      });
    }
  }
}

module.exports = new MapController();
