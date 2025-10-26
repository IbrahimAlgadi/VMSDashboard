const { NVR, Branch } = require('../models');
const MOCK_DATA = require('../config/constants');

class NVRController {
  // GET /nvr-management
  async showNVRManagement(req, res) {
    try {
      const nvrs = await NVR.findAll({
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }],
        where: { is_active: true },
        order: [['name', 'ASC']]
      }).catch(() => []);

      // Use database data if available, otherwise use mock data
      const nvrList = nvrs.length > 0 ? nvrs : MOCK_DATA.nvrs;

      res.render('nvr-management', {
        title: 'NVR Management',
        currentPage: 'nvr-management',
        nvrs: nvrList
      });
    } catch (error) {
      console.error('Error loading NVRs:', error);
      // Fallback to mock data
      res.render('nvr-management', {
        title: 'NVR Management',
        currentPage: 'nvr-management',
        nvrs: MOCK_DATA.nvrs
      });
    }
  }
}

module.exports = new NVRController();
