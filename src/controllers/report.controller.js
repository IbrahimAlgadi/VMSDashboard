const { Report, User } = require('../models');
const MOCK_DATA = require('../config/constants');

class ReportController {
  // GET /reports
  async showReports(req, res) {
    try {
      const reports = await Report.findAll({
        include: [{
          model: User,
          as: 'generatedBy',
          attributes: ['id', 'username', 'full_name']
        }],
        order: [['created_at', 'DESC']],
        limit: 100
      }).catch(() => []);

      const reportList = reports.length > 0 ? reports : MOCK_DATA.reports;

      res.render('reports', {
        title: 'Reports',
        currentPage: 'reports',
        reports: reportList
      });
    } catch (error) {
      console.error('Error loading reports:', error);
      res.render('reports', {
        title: 'Reports',
        currentPage: 'reports',
        reports: MOCK_DATA.reports
      });
    }
  }
}

module.exports = new ReportController();
