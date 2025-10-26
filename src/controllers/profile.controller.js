class ProfileController {
  // GET /profile
  showProfile(req, res) {
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

module.exports = new ProfileController();
