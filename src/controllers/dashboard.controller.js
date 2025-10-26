const MOCK_DATA = require('../config/constants');

class DashboardController {
  // GET /
  showDashboard(req, res) {
    console.log(MOCK_DATA.dashboard);
    
    res.render('dashboard', {
      title: 'Dashboard',
      currentPage: 'dashboard',
      data: MOCK_DATA.dashboard
    });
  }
}

module.exports = new DashboardController();
