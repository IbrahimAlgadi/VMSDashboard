const { 
  createTestRegion, 
  createTestBranch, 
  createTestNVR,
  createTestCamera,
  cleanupTestData,
  validateCameraResponse 
} = require('../helpers/test-utils.js');

describe('Camera CRUD Operations - Direct Model Tests', () => {
  let testRegion;
  let testBranch;
  let testNVR;
  let testCamera;

  // Setup before each test
  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test data
    testRegion = await createTestRegion();
    testBranch = await createTestBranch({ region_id: testRegion.id });
    testNVR = await createTestNVR({ branch_id: testBranch.id });
    testCamera = await createTestCamera({ 
      branch_id: testBranch.id,
      nvr_id: testNVR.id 
    });
  });

  // Cleanup after each test
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('CREATE Camera', () => {
    test('should create a new camera with valid data', async () => {
      const cameraData = {
        name: 'TEST-CAM-NEW',
        position: 'Back Entrance',
        ip_address: '192.168.1.201',
        branch_id: testBranch.id,
        nvr_id: testNVR.id,
        status: 'online',
        model: 'Test Model Pro',
        manufacturer: 'Test Manufacturer',
        resolution: '4K',
        fps: 30,
        bitrate: 8192,
        edge_storage_size: 500,
        uptime_percent: 98.5
      };

      const newCamera = await createTestCamera(cameraData);
      
      expect(newCamera).toBeDefined();
      expect(newCamera.name).toBe(cameraData.name);
      expect(newCamera.position).toBe(cameraData.position);
      expect(newCamera.ip_address).toBe(cameraData.ip_address);
      expect(newCamera.branch_id).toBe(cameraData.branch_id);
      expect(newCamera.nvr_id).toBe(cameraData.nvr_id);
      expect(newCamera.status).toBe(cameraData.status);
      expect(newCamera.model).toBe(cameraData.model);
      expect(newCamera.manufacturer).toBe(cameraData.manufacturer);
      expect(newCamera.resolution).toBe(cameraData.resolution);
      expect(newCamera.fps).toBe(cameraData.fps);
      expect(newCamera.bitrate).toBe(cameraData.bitrate);
      expect(newCamera.edge_storage_size).toBe(cameraData.edge_storage_size);
      expect(newCamera.uptime_percent).toBe(parseFloat(cameraData.uptime_percent));
    });

    test('should fail to create camera with duplicate camera name', async () => {
      const cameraData = {
        name: testCamera.name, // Same as existing camera
        position: 'Different Position',
        ip_address: '192.168.1.202',
        branch_id: testBranch.id,
        nvr_id: testNVR.id
      };

      await expect(createTestCamera(cameraData)).rejects.toThrow();
    });

    test('should allow camera with duplicate IP address (no unique constraint)', async () => {
      const cameraData = {
        name: 'TEST-CAM-DUPLICATE-IP',
        position: 'Different Position',
        ip_address: testCamera.ip_address, // Same as existing camera
        branch_id: testBranch.id,
        nvr_id: testNVR.id
      };

      // This should succeed since there's no unique constraint on IP address
      const newCamera = await createTestCamera(cameraData);
      expect(newCamera).toBeDefined();
      expect(newCamera.name).toBe(cameraData.name);
      expect(newCamera.ip_address).toBe(cameraData.ip_address);
    });
  });

  describe('READ Camera', () => {
    test('should find camera by ID', async () => {
      const foundCamera = await testCamera.constructor.findByPk(testCamera.id);
      
      expect(foundCamera).toBeDefined();
      expect(foundCamera.id).toBe(testCamera.id);
      expect(foundCamera.name).toBe(testCamera.name);
    });

    test('should find all cameras', async () => {
      const allCameras = await testCamera.constructor.findAll();
      
      expect(Array.isArray(allCameras)).toBe(true);
      expect(allCameras.length).toBeGreaterThan(0);
      
      const foundCamera = allCameras.find(camera => camera.id === testCamera.id);
      expect(foundCamera).toBeDefined();
    });

    test('should find cameras by branch', async () => {
      const camerasByBranch = await testCamera.constructor.findAll({
        where: { branch_id: testBranch.id }
      });
      
      expect(Array.isArray(camerasByBranch)).toBe(true);
      expect(camerasByBranch.length).toBeGreaterThan(0);
      
      const foundCamera = camerasByBranch.find(camera => camera.id === testCamera.id);
      expect(foundCamera).toBeDefined();
    });

    test('should find cameras by NVR', async () => {
      const camerasByNVR = await testCamera.constructor.findAll({
        where: { nvr_id: testNVR.id }
      });
      
      expect(Array.isArray(camerasByNVR)).toBe(true);
      expect(camerasByNVR.length).toBeGreaterThan(0);
      
      const foundCamera = camerasByNVR.find(camera => camera.id === testCamera.id);
      expect(foundCamera).toBeDefined();
    });
  });

  describe('UPDATE Camera', () => {
    test('should update camera status', async () => {
      const updatedCamera = await testCamera.update({ 
        status: 'online',
        uptime_percent: 99.5 
      });

      expect(updatedCamera.status).toBe('online');
      expect(updatedCamera.uptime_percent).toBe(99.5);
    });

    test('should update camera position', async () => {
      const updatedCamera = await testCamera.update({ 
        position: 'Updated Position' 
      });

      expect(updatedCamera.position).toBe('Updated Position');
    });

    test('should update camera technical specifications', async () => {
      const updatedCamera = await testCamera.update({ 
        model: 'Updated Model',
        manufacturer: 'Updated Manufacturer',
        resolution: '4K',
        fps: 60,
        bitrate: 16384,
        edge_storage_size: 1000
      });

      expect(updatedCamera.model).toBe('Updated Model');
      expect(updatedCamera.manufacturer).toBe('Updated Manufacturer');
      expect(updatedCamera.resolution).toBe('4K');
      expect(updatedCamera.fps).toBe(60);
      expect(updatedCamera.bitrate).toBe(16384);
      expect(updatedCamera.edge_storage_size).toBe(1000);
    });
  });

  describe('DELETE Camera', () => {
    test('should delete camera', async () => {
      const cameraId = testCamera.id;
      
      // Delete the camera
      await testCamera.destroy();
      
      // Verify it's deleted
      const deletedCamera = await testCamera.constructor.findByPk(cameraId);
      expect(deletedCamera).toBeNull();
    });

    test('should handle deletion of non-existent camera', async () => {
      const nonExistentId = 99999;
      
      // Try to delete non-existent camera
      const result = await testCamera.constructor.destroy({
        where: { id: nonExistentId }
      });
      
      expect(result).toBe(0); // No rows affected
    });
  });

  describe('Camera Data Validation', () => {
    test('should validate camera data structure', () => {
      validateCameraResponse(testCamera);
    });

    test('should handle camera with all optional fields', async () => {
      const cameraData = {
        name: 'TEST-CAM-FULL',
        position: 'Main Lobby',
        ip_address: '192.168.1.206',
        branch_id: testBranch.id,
        nvr_id: testNVR.id,
        status: 'online',
        model: 'Professional Camera Pro',
        manufacturer: 'Security Systems Inc',
        resolution: '4K Ultra HD',
        fps: 60,
        bitrate: 16384,
        edge_storage_size: 1000,
        uptime_percent: 99.8
      };

      const newCamera = await createTestCamera(cameraData);
      
      expect(newCamera).toBeDefined();
      validateCameraResponse(newCamera);
      expect(newCamera.name).toBe(cameraData.name);
      expect(newCamera.model).toBe(cameraData.model);
      expect(newCamera.manufacturer).toBe(cameraData.manufacturer);
      expect(newCamera.resolution).toBe(cameraData.resolution);
      expect(newCamera.fps).toBe(cameraData.fps);
      expect(newCamera.bitrate).toBe(cameraData.bitrate);
    });

    test('should handle camera with minimal required fields', async () => {
      const cameraData = {
        name: 'TEST-CAM-MINIMAL',
        position: 'Minimal Position',
        ip_address: '192.168.1.207',
        branch_id: testBranch.id,
        nvr_id: testNVR.id
        // Only required fields, no optional fields
      };

      const newCamera = await createTestCamera(cameraData);
      
      expect(newCamera).toBeDefined();
      validateCameraResponse(newCamera);
      expect(newCamera.name).toBe(cameraData.name);
      expect(newCamera.position).toBe(cameraData.position);
      expect(newCamera.ip_address).toBe(cameraData.ip_address);
    });
  });
});
