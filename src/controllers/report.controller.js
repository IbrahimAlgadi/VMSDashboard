const MOCK_DATA = require('../config/constants');

class ReportController {
  // GET /reports
  showReports(req, res) {
    res.render('reports', {
      title: 'Reports',
      currentPage: 'reports',
      reports: MOCK_DATA.reports
    });
  }
}

module.exports = new ReportController();
