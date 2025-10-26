const MOCK_DATA = require('../config/constants');

class SecurityController {
  // GET /security
  showSecurity(req, res) {
    res.render('security', {
      title: 'Security',
      currentPage: 'security',
      events: MOCK_DATA.security.events
    });
  }
}

module.exports = new SecurityController();
