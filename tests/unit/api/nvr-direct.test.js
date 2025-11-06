const { 
  createTestRegion, 
  createTestBranch, 
  createTestNVR, 
  cleanupTestData,
  validateNVRResponse 
} = require('../helpers/test-utils.js');

describe('NVR CRUD Operations - Direct Model Tests', () => {
  let testRegion;
  let testBranch;
  let testNVR;

  // Setup before each test
  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test data
    testRegion = await createTestRegion();
    testBranch = await createTestBranch({ region_id: testRegion.id });
    testNVR = await createTestNVR({ branch_id: testBranch.id });
  });

  // Cleanup after each test
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('CREATE NVR', () => {
    test('should create a new NVR with valid data', async () => {
      const nvrData = {
        device_name: 'TEST-NVR-NEW',
        ip_address: '192.168.1.200',
        branch_id: testBranch.id,
        status: 'online',
        max_cameras: 32,
        current_cameras: 0,
        uptime_percent: 95.5,
        is_active: true
      };

      const newNVR = await createTestNVR(nvrData);
      
      expect(newNVR).toBeDefined();
      expect(newNVR.device_name).toBe(nvrData.device_name);
      expect(newNVR.ip_address).toBe(nvrData.ip_address);
      expect(newNVR.branch_id).toBe(nvrData.branch_id);
      expect(newNVR.status).toBe(nvrData.status);
      expect(newNVR.max_cameras).toBe(nvrData.max_cameras);
      expect(newNVR.current_cameras).toBe(nvrData.current_cameras);
      expect(newNVR.uptime_percent).toBe(parseFloat(nvrData.uptime_percent));
    });

    test('should fail to create NVR with duplicate device name', async () => {
      const nvrData = {
        device_name: testNVR.device_name, // Same as existing NVR
        ip_address: '192.168.1.201',
        branch_id: testBranch.id
      };

      await expect(createTestNVR(nvrData)).rejects.toThrow();
    });

    test('should allow NVR with duplicate IP address (no unique constraint)', async () => {
      const nvrData = {
        device_name: 'TEST-NVR-DUPLICATE-IP',
        ip_address: testNVR.ip_address, // Same as existing NVR
        branch_id: testBranch.id
      };

      // This should succeed since there's no unique constraint on IP address
      const newNVR = await createTestNVR(nvrData);
      expect(newNVR).toBeDefined();
      expect(newNVR.device_name).toBe(nvrData.device_name);
      expect(newNVR.ip_address).toBe(nvrData.ip_address);
    });
  });

  describe('READ NVR', () => {
    test('should find NVR by ID', async () => {
      const foundNVR = await testNVR.constructor.findByPk(testNVR.id);
      
      expect(foundNVR).toBeDefined();
      expect(foundNVR.id).toBe(testNVR.id);
      expect(foundNVR.device_name).toBe(testNVR.device_name);
    });

    test('should find all NVRs', async () => {
      const allNVRs = await testNVR.constructor.findAll();
      
      expect(Array.isArray(allNVRs)).toBe(true);
      expect(allNVRs.length).toBeGreaterThan(0);
      
      const foundNVR = allNVRs.find(nvr => nvr.id === testNVR.id);
      expect(foundNVR).toBeDefined();
    });

    test('should find NVRs by branch', async () => {
      const nvrsByBranch = await testNVR.constructor.findAll({
        where: { branch_id: testBranch.id }
      });
      
      expect(Array.isArray(nvrsByBranch)).toBe(true);
      expect(nvrsByBranch.length).toBeGreaterThan(0);
      
      const foundNVR = nvrsByBranch.find(nvr => nvr.id === testNVR.id);
      expect(foundNVR).toBeDefined();
    });
  });

  describe('UPDATE NVR', () => {
    test('should update NVR status', async () => {
      const updatedNVR = await testNVR.update({ 
        status: 'online',
        uptime_percent: 98.5 
      });

      expect(updatedNVR.status).toBe('online');
      expect(updatedNVR.uptime_percent).toBe(98.5);
    });

    test('should update NVR camera count', async () => {
      const updatedNVR = await testNVR.update({ 
        current_cameras: 5 
      });

      expect(updatedNVR.current_cameras).toBe(5);
    });

    test('should update NVR technical specifications', async () => {
      const updatedNVR = await testNVR.update({ 
        processor: 'Intel Core i7',
        ram: '16GB',
        device_id: 'DEV123',
        product_id: 'PROD456',
        system_type: 'Linux',
        securos_version: '2.1.0'
      });

      expect(updatedNVR.processor).toBe('Intel Core i7');
      expect(updatedNVR.ram).toBe('16GB');
      expect(updatedNVR.device_id).toBe('DEV123');
      expect(updatedNVR.product_id).toBe('PROD456');
      expect(updatedNVR.system_type).toBe('Linux');
      expect(updatedNVR.securos_version).toBe('2.1.0');
    });
  });

  describe('DELETE NVR', () => {
    test('should delete NVR', async () => {
      const nvrId = testNVR.id;
      
      // Delete the NVR
      await testNVR.destroy();
      
      // Verify it's deleted
      const deletedNVR = await testNVR.constructor.findByPk(nvrId);
      expect(deletedNVR).toBeNull();
    });

    test('should handle deletion of non-existent NVR', async () => {
      const nonExistentId = 99999;
      
      // Try to delete non-existent NVR
      const result = await testNVR.constructor.destroy({
        where: { id: nonExistentId }
      });
      
      expect(result).toBe(0); // No rows affected
    });
  });

  describe('NVR Data Validation', () => {
    test('should validate NVR data structure', () => {
      validateNVRResponse(testNVR);
    });

    test('should handle NVR with all optional fields', async () => {
      const nvrData = {
        device_name: 'TEST-NVR-FULL',
        ip_address: '192.168.1.203',
        branch_id: testBranch.id,
        status: 'online',
        processor: 'Intel Core i7',
        ram: '16GB',
        device_id: 'DEV123',
        product_id: 'PROD456',
        system_type: 'Linux',
        securos_version: '2.1.0',
        max_cameras: 64,
        current_cameras: 10,
        installation_date: '2024-01-15',
        warranty_expiry: '2027-01-15',
        previous_maintenance_date: '2024-06-15',
        maintenance_period_days: 90,
        next_maintenance_date: '2024-09-15',
        uptime_percent: 99.2,
        is_active: true
      };

      const newNVR = await createTestNVR(nvrData);
      
      expect(newNVR).toBeDefined();
      validateNVRResponse(newNVR);
      expect(newNVR.device_name).toBe(nvrData.device_name);
      expect(newNVR.processor).toBe(nvrData.processor);
      expect(newNVR.ram).toBe(nvrData.ram);
    });
  });
});
