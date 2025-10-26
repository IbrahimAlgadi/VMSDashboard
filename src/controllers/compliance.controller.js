const MOCK_DATA = require('../config/constants');

class ComplianceController {
  // GET /compliance
  showCompliance(req, res) {
    res.render('compliance', {
      title: 'Compliance',
      currentPage: 'compliance',
      data: MOCK_DATA.compliance
    });
  }
}

module.exports = new ComplianceController();
