const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Nunjucks
const env = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: true,
  noCache: true
});

// Add stringify filter for JSON output
env.addFilter('stringify', function(obj) {
  return JSON.stringify(obj);
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

// Database connection and server start
const { sequelize } = require('./src/models');

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync models - only create if they don't exist (development mode)
    await sequelize.sync({ force: false });
    console.log('📊 Database tables ready');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 VMS Dashboard ready with Sequelize!`);
      console.log('💡 Using mock data for now - database tables will be created');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

