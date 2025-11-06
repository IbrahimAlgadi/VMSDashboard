const { NVR, Camera, Branch, Region, NVRHealthMetrics, CameraHealthMetrics } = require('../../../src/models/index.js');

/**
 * Test Data Factories
 */

// Create test region
const createTestRegion = async (overrides = {}) => {
  const timestamp = Date.now();
  const regionData = {
    name: `Test Region ${timestamp}`,
    code: `TR${timestamp.toString().slice(-6)}`, // Use only last 6 digits to stay under 10 chars
    description: 'Test region for unit tests',
    coordinates: { lat: 40.7128, lng: -74.0060 }, // Add coordinates
    timezone: 'UTC',
    is_active: true,
    ...overrides
  };
  
  return await Region.create(regionData);
};

// Create test branch
const createTestBranch = async (overrides = {}) => {
  const timestamp = Date.now();
  const branchData = {
    name: `Test Branch ${timestamp}`,
    branch_code: `TB${timestamp.toString().slice(-6)}`, // Use only last 6 digits to stay under 20 chars
    branch_type: 'Branch', // Valid enum value
    address: '123 Test Street',
    coordinates: { lat: 40.7128, lng: -74.0060 }, // JSON object, not string
    contact_phone: '123-456-7890',
    manager_name: 'Test Manager',
    operating_hours: { start: '09:00', end: '17:00' }, // JSON object
    status: 'online', // Valid enum value
    is_active: true,
    region_id: 1, // Will be set by test
    ...overrides
  };
  
  return await Branch.create(branchData);
};

// Create test NVR
const createTestNVR = async (overrides = {}) => {
  const timestamp = Date.now();
  const nvrData = {
    device_name: `TEST-NVR-${timestamp}`,
    ip_address: `192.168.1.${timestamp % 255}`,
    branch_id: 1, // Will be set by test
    status: 'offline',
    max_cameras: 16,
    current_cameras: 0,
    uptime_percent: 0.00,
    is_active: true,
    ...overrides
  };
  
  return await NVR.create(nvrData);
};

// Create test camera
const createTestCamera = async (overrides = {}) => {
  const timestamp = Date.now();
  const cameraData = {
    name: `TEST-CAM-${timestamp}`,
    position: 'Main Entrance',
    ip_address: `192.168.1.${(timestamp % 200) + 50}`,
    branch_id: 1, // Will be set by test
    nvr_id: 1, // Will be set by test
    status: 'offline',
    model: 'Test Model',
    manufacturer: 'Test Manufacturer',
    resolution: '1920x1080',
    fps: 25,
    uptime_percent: 0.00,
    ...overrides
  };
  
  return await Camera.create(cameraData);
};

/**
 * Test Cleanup Utilities
 */

// Clean up all test data
const cleanupTestData = async () => {
  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    await CameraHealthMetrics.destroy({ where: {}, force: true });
    await NVRHealthMetrics.destroy({ where: {}, force: true });
    await Camera.destroy({ where: {}, force: true });
    await NVR.destroy({ where: {}, force: true });
    await Branch.destroy({ where: {}, force: true });
    await Region.destroy({ where: {}, force: true });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};

// Clean up specific entity
const cleanupEntity = async (Model, whereClause = {}) => {
  try {
    await Model.destroy({ where: whereClause, force: true });
  } catch (error) {
    console.error(`Error cleaning up ${Model.name}:`, error);
  }
};

/**
 * Test Data Validation Utilities
 */

// Validate NVR response structure
const validateNVRResponse = (nvr) => {
  expect(nvr).toHaveProperty('id');
  expect(nvr).toHaveProperty('device_name');
  expect(nvr).toHaveProperty('ip_address');
  expect(nvr).toHaveProperty('branch_id');
  expect(nvr).toHaveProperty('status');
  expect(nvr).toHaveProperty('max_cameras');
  expect(nvr).toHaveProperty('current_cameras');
  expect(nvr).toHaveProperty('is_active');
};

// Validate Camera response structure
const validateCameraResponse = (camera) => {
  expect(camera).toHaveProperty('id');
  expect(camera).toHaveProperty('name');
  expect(camera).toHaveProperty('position');
  expect(camera).toHaveProperty('ip_address');
  expect(camera).toHaveProperty('branch_id');
  expect(camera).toHaveProperty('nvr_id');
  expect(camera).toHaveProperty('status');
  expect(camera).toHaveProperty('fps');
};

module.exports = {
  // Factories
  createTestRegion,
  createTestBranch,
  createTestNVR,
  createTestCamera,
  
  // Cleanup
  cleanupTestData,
  cleanupEntity,
  
  // Validation
  validateNVRResponse,
  validateCameraResponse
};
