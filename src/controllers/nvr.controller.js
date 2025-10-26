const MOCK_DATA = require('../config/constants');

class NVRController {
  // GET /nvr-management
  showNVRManagement(req, res) {
    res.render('nvr-management', {
      title: 'NVR Management',
      currentPage: 'nvr-management',
      nvrs: MOCK_DATA.nvrs
    });
  }
}

module.exports = new NVRController();
