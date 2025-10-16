const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Nunjucks
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: true,
  noCache: true
});

// Set view engine
app.set('view engine', 'njk');

// Static files
app.use(express.static('public'));
app.use('/data', express.static('data'));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    currentPage: 'dashboard'
  });
});

app.get('/nvr-management', (req, res) => {
  res.render('nvr-management', {
    title: 'NVR Management',
    currentPage: 'nvr-management'
  });
});

app.get('/camera-management', (req, res) => {
  res.render('camera-management', {
    title: 'Camera Management',
    currentPage: 'camera-management'
  });
});

app.get('/map', (req, res) => {
  res.render('map', {
    title: 'Location Map',
    currentPage: 'map'
  });
});

app.get('/compliance', (req, res) => {
  res.render('compliance', {
    title: 'Compliance',
    currentPage: 'compliance'
  });
});

app.get('/security', (req, res) => {
  res.render('security', {
    title: 'Security',
    currentPage: 'security'
  });
});

app.get('/analytics', (req, res) => {
  res.render('analytics', {
    title: 'Analytics',
    currentPage: 'analytics'
  });
});

app.get('/alerts', (req, res) => {
  res.render('alerts', {
    title: 'Alerts',
    currentPage: 'alerts'
  });
});

app.get('/reports', (req, res) => {
  res.render('reports', {
    title: 'Reports',
    currentPage: 'reports'
  });
});

app.get('/settings', (req, res) => {
  res.render('settings', {
    title: 'Settings',
    currentPage: 'settings'
  });
});

app.get('/profile', (req, res) => {
  res.render('profile', {
    title: 'Profile',
    currentPage: 'profile'
  });
});

app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login',
    currentPage: 'login'
  });
});

app.get('/styleguide', (req, res) => {
  res.render('styleguide', {
    title: 'Style Guide',
    currentPage: 'styleguide'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: '404 Not Found',
    currentPage: 'error'
  });
});

// 500 handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', {
    title: '500 Server Error',
    currentPage: 'error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 CCTV Dashboard ready!`);
});

module.exports = app;

