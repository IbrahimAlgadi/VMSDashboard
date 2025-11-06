const { sequelize } = require('../src/models');

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Connect to test database
  try {
    await sequelize.authenticate();
    console.log('✅ Test database connected successfully');
  } catch (error) {
    console.error('❌ Unable to connect to test database:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('❌ Error closing test database connection:', error);
  }
});

// Clean up after each test
afterEach(async () => {
  // Clean up any test data if needed
  // This will be implemented per test file as needed
});




