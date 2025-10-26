const { SecurityEvent, Branch } = require('../models');
const MOCK_DATA = require('../config/constants');

class SecurityController {
  // GET /security
  async showSecurity(req, res) {
    try {
      const events = await SecurityEvent.findAll({
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }],
        order: [['created_at', 'DESC']],
        limit: 100
      }).catch(() => []);

      const eventList = events.length > 0 ? events : MOCK_DATA.security.events;

      res.render('security', {
        title: 'Security',
        currentPage: 'security',
        events: eventList
      });
    } catch (error) {
      console.error('Error loading security events:', error);
      res.render('security', {
        title: 'Security',
        currentPage: 'security',
        events: MOCK_DATA.security.events
      });
    }
  }
}

module.exports = new SecurityController();
