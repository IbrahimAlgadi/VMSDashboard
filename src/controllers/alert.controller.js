const MOCK_DATA = require('../config/constants');

class AlertController {
  // GET /alerts
  showAlerts(req, res) {
    res.render('alerts', {
      title: 'Alerts',
      currentPage: 'alerts',
      alerts: MOCK_DATA.alerts
    });
  }
}

module.exports = new AlertController();
