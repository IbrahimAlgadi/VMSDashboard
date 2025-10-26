class SettingsController {
  // GET /settings
  showSettings(req, res) {
    res.render('settings', {
      title: 'Settings',
      currentPage: 'settings'
    });
  }
}

module.exports = new SettingsController();
