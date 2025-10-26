const MOCK_DATA = require('../config/constants');

class AnalyticsController {
  // GET /analytics
  showAnalytics(req, res) {
    console.log(MOCK_DATA.analytics.charts);
    res.render('analytics', {
      title: 'Analytics',
      currentPage: 'analytics',
      charts: MOCK_DATA.analytics.charts
    });
  }
}

module.exports = new AnalyticsController();
