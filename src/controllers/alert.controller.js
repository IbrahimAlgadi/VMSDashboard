const { Alert, Branch } = require('../models');
const MOCK_DATA = require('../config/constants');

class AlertController {
  // GET /alerts
  async showAlerts(req, res) {
    try {
      const alerts = await Alert.findAll({
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }],
        order: [['created_at', 'DESC']],
        limit: 100
      }).catch(() => []);

      const alertList = alerts.length > 0 ? alerts : MOCK_DATA.alerts;

      res.render('alerts', {
        title: 'Alerts',
        currentPage: 'alerts',
        alerts: alertList
      });
    } catch (error) {
      console.error('Error loading alerts:', error);
      res.render('alerts', {
        title: 'Alerts',
        currentPage: 'alerts',
        alerts: MOCK_DATA.alerts
      });
    }
  }
}

module.exports = new AlertController();
