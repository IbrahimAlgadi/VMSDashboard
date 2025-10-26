const { ComplianceResult, ComplianceRequirement, Branch } = require('../models');
const MOCK_DATA = require('../config/constants');

class ComplianceController {
  // GET /compliance
  async showCompliance(req, res) {
    try {
      const results = await ComplianceResult.findAll({
        include: [
          { model: ComplianceRequirement, as: 'requirement', attributes: ['id', 'name', 'code'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ],
        order: [['check_timestamp', 'DESC']],
        limit: 100
      }).catch(() => []);

      if (results.length > 0) {
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const warning = results.filter(r => r.status === 'warning').length;

        const data = {
          overall: results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : 0,
          requirements: results.slice(0, 20),
          failed,
          passed,
          warning
        };

        return res.render('compliance', {
          title: 'Compliance',
          currentPage: 'compliance',
          data
        });
      }

      // Fallback to mock data
      res.render('compliance', {
        title: 'Compliance',
        currentPage: 'compliance',
        data: MOCK_DATA.compliance
      });
    } catch (error) {
      console.error('Error loading compliance:', error);
      res.render('compliance', {
        title: 'Compliance',
        currentPage: 'compliance',
        data: MOCK_DATA.compliance
      });
    }
  }
}

module.exports = new ComplianceController();
