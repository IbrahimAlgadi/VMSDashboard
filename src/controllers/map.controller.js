const MOCK_DATA = require('../config/constants');

class MapController {
  // GET /map
  showMap(req, res) {
    res.render('map', {
      title: 'Location Map',
      currentPage: 'map',
      nvrs: MOCK_DATA.nvrs
    });
  }
}

module.exports = new MapController();
