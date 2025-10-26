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

// Import routes
const routes = require('./src/routes');

// Use routes
app.use('/', routes);

// Keep login and styleguide routes (no controller needed yet)
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

