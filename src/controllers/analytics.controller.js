const { AnalyticsData } = require('../models');
const MOCK_DATA = require('../config/constants');

class AnalyticsController {
  // GET /analytics
  async showAnalytics(req, res) {
    try {
      // Get last 7 days of analytics data
      const last7Days = await AnalyticsData.findAll({
        where: {
          timestamp: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['timestamp', 'ASC']]
      }).catch(() => []);

      let charts = MOCK_DATA.analytics.charts;

      if (last7Days.length > 0) {
        // Process analytics data
        const uptimeData = last7Days.filter(d => d.metric_type === 'uptime').map(d => d.value);
        const storageData = last7Days.filter(d => d.metric_type === 'storage').map(d => d.value);
        const alertsData = last7Days.filter(d => d.metric_type === 'alerts').map(d => d.value);

        charts = {
          uptime: uptimeData.length > 0 ? uptimeData : MOCK_DATA.analytics.charts.uptime,
          storage: storageData.length > 0 ? storageData : MOCK_DATA.analytics.charts.storage,
          alerts: alertsData.length > 0 ? alertsData : MOCK_DATA.analytics.charts.alerts
        };
      }

      res.render('analytics', {
        title: 'Analytics',
        currentPage: 'analytics',
        charts
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      res.render('analytics', {
        title: 'Analytics',
        currentPage: 'analytics',
        charts: MOCK_DATA.analytics.charts
      });
    }
  }
}

module.exports = new AnalyticsController();
