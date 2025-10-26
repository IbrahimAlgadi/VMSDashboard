const { SystemSetting } = require('../models');

class SettingsController {
  // GET /settings
  async showSettings(req, res) {
    try {
      const settings = await SystemSetting.findAll({
        order: [['category', 'ASC'], ['key', 'ASC']]
      }).catch(() => []);

      res.render('settings', {
        title: 'Settings',
        currentPage: 'settings',
        settings
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      res.render('settings', {
        title: 'Settings',
        currentPage: 'settings',
        settings: []
      });
    }
  }
}

module.exports = new SettingsController();
