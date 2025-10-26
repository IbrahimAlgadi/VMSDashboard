const { User } = require('../models');

class ProfileController {
  // GET /profile
  async showProfile(req, res) {
    try {
      // TODO: Get actual logged-in user ID from session
      const userId = req.session?.userId || 1;
      
      const user = await User.findByPk(userId).catch(() => null);

      const userData = user || {
        username: 'admin',
        fullName: 'System Administrator',
        email: 'admin@vms-dashboard.sa',
        role: 'admin',
        department: 'IT Security'
      };

      res.render('profile', {
        title: 'Profile',
        currentPage: 'profile',
        user: userData
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      res.render('profile', {
        title: 'Profile',
        currentPage: 'profile',
        user: {
          username: 'admin',
          fullName: 'System Administrator',
          email: 'admin@vms-dashboard.sa',
          role: 'admin',
          department: 'IT Security'
        }
      });
    }
  }
}

module.exports = new ProfileController();
