const { Client } = require('pg');
const { Region, Branch, NVR, Camera, NVRStorage, CameraUptime } = require('../models');
const { validateInitializationData } = require('../utils/validation');

class InitializationController {
  /**
   * POST /api/initialize
   * Bulk initialization API for setting up regions, branches, NVRs and cameras
   * 
   * Expected JSON structure:
   * {
   *   "region": {
   *     "name": "Riyadh Region",
   *     "code": "RD",
   *     "description": "Main region covering Riyadh area",
   *     "coordinates": {"lat": 24.7136, "lng": 46.6753},
   *     "timezone": "Asia/Riyadh",
   *     "branches": [
   *       {
   *         "name": "Main Branch Riyadh",
   *         "branch_code": "RD-001",
   *         "branch_type": "Main Branch",
   *         "address": "King Fahd Road, Riyadh",
   *         "coordinates": {"lat": 24.7136, "lng": 46.6753},
   *         "contact_phone": "+966-11-XXXXXX",
   *         "manager_name": "Ahmad Al-Saudi",
   *         "operating_hours": {
   *           "weekdays": "08:00-17:00",
   *           "weekend": "closed"
   *         },
   *         "nvrs": [
   *           {
   *             "device_name": "NVR-RD-001-01",
   *             "hostname": "DESKTOP-T7MNQIA",
   *             "processor": "Intel i7-8700",
   *             "ram": "32GB DDR4",
   *             "device_id": "HIK-123456",
   *             "product_id": "DS-7616NI-K2",
   *             "system_type": "Hikvision NVR System",
   *             "securos_version": "v4.3.1",
   *             "ip_address": "192.168.1.100",
   *             "max_cameras": 16,
   *             "installation_date": "2024-01-15",
   *             "maintenance_period_days": 90,
   *             "warranty_expiry": "2026-01-15",
   *             "storage": {
   *               "storage_total_gb": 8000,
   *               "storage_used_gb": 2400
   *             },
   *             "cameras": [
   *               {
   *                 "name": "CAM-RD-001-01",
   *                 "position": "Main Entrance",
   *                 "ip_address": "192.168.1.101",
   *                 "model": "DS-2CD2142FWD-I",
   *                 "manufacturer": "Hikvision",
   *                 "resolution": "4MP",
   *                 "fps": 25,
   *                 "bitrate": 6144,
   *                 "edge_storage_size": 128,
   *                 "status": "online"
   *               }
   *             ]
   *           }
   *         ]
   *       }
   *     ]
   *   }
   * }
   */
  async initializeSystem(req, res) {
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'vms_dashboard',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });

    try {
      // Validate input data structure
      const validationResult = validateInitializationData(req.body);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.errors
        });
      }

      await client.connect();
      await client.query('BEGIN'); // Start transaction

      const { region } = req.body;
      const summary = {
        regions: 0,
        branches: 0,
        nvrs: 0,
        cameras: 0,
        storage_configs: 0,
        errors: []
      };

      console.log(`🚀 Starting initialization for region: ${region.name}`);

      // 1. Create/Update Region
      const regionData = {
        name: region.name,
        code: region.code,
        description: region.description || '',
        coordinates: JSON.stringify(region.coordinates || {}),
        timezone: region.timezone || 'Asia/Riyadh',
        is_active: true
      };

      const regionQuery = `
        INSERT INTO regions (name, code, description, coordinates, timezone, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (code) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          coordinates = EXCLUDED.coordinates,
          timezone = EXCLUDED.timezone,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, name, code;
      `;

      const regionResult = await client.query(regionQuery, [
        regionData.name, regionData.code, regionData.description,
        regionData.coordinates, regionData.timezone, regionData.is_active
      ]);

      const createdRegion = regionResult.rows[0];
      summary.regions = 1;
      console.log(`✅ Region created/updated: ${createdRegion.name} (${createdRegion.code})`);

      // 2. Process Branches
      if (region.branches && Array.isArray(region.branches)) {
        for (const branchData of region.branches) {
          try {
            // Create Branch
            const branchQuery = `
              INSERT INTO branches (
                region_id, name, branch_code, branch_type, address, coordinates,
                contact_phone, manager_name, operating_hours, status, is_active,
                created_at, updated_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT (branch_code)
              DO UPDATE SET 
                name = EXCLUDED.name,
                branch_type = EXCLUDED.branch_type,
                address = EXCLUDED.address,
                coordinates = EXCLUDED.coordinates,
                contact_phone = EXCLUDED.contact_phone,
                manager_name = EXCLUDED.manager_name,
                operating_hours = EXCLUDED.operating_hours,
                updated_at = CURRENT_TIMESTAMP
              RETURNING id, name, branch_code;
            `;

            // Handle coordinates format - can be array [lat, lng] or object {lat, lng}
            let coordinates = {};
            if (branchData.coordinates) {
              if (Array.isArray(branchData.coordinates) && branchData.coordinates.length === 2) {
                coordinates = { lat: branchData.coordinates[0], lng: branchData.coordinates[1] };
              } else if (branchData.coordinates.lat && branchData.coordinates.lng) {
                coordinates = { lat: branchData.coordinates.lat, lng: branchData.coordinates.lng };
              }
            }

            const branchResult = await client.query(branchQuery, [
              createdRegion.id,
              branchData.name,
              branchData.branch_code,
              branchData.branch_type || 'Branch',
              branchData.address,
              JSON.stringify(coordinates),
              branchData.contact_phone || null,
              branchData.manager_name || null,
              JSON.stringify(branchData.operating_hours || {}),
              'online', // Default status
              true
            ]);

            const createdBranch = branchResult.rows[0];
            summary.branches++;
            console.log(`✅ Branch created/updated: ${createdBranch.name} (${createdBranch.branch_code})`);

            // 3. Process NVRs for this Branch
            if (branchData.nvrs && Array.isArray(branchData.nvrs)) {
              for (const nvrData of branchData.nvrs) {
                try {
                  // First check if NVR exists by hostname or device_name
                  const existingNvrQuery = `
                    SELECT id, device_name, hostname FROM nvrs 
                    WHERE hostname = $1 OR device_name = $2 
                    LIMIT 1;
                  `;
                  
                  const existingNvr = await client.query(existingNvrQuery, [nvrData.hostname, nvrData.device_name]);
                  
                  let nvrResult;
                  const currentCameras = nvrData.cameras ? nvrData.cameras.length : 0;
                  
                  if (existingNvr.rows.length > 0) {
                    // Update existing NVR
                    const updateQuery = `
                      UPDATE nvrs SET 
                        branch_id = $1,
                        device_name = $2,
                        hostname = $3,
                        processor = $4,
                        ram = $5,
                        device_id = $6,
                        product_id = $7,
                        system_type = $8,
                        securos_version = $9,
                        ip_address = $10,
                        max_cameras = $11,
                        current_cameras = $12,
                        status = $13,
                        uptime_percent = $14,
                        installation_date = $15,
                        maintenance_period_days = $16,
                        warranty_expiry = $17,
                        updated_at = CURRENT_TIMESTAMP
                      WHERE id = $18
                      RETURNING id, device_name, hostname;
                    `;
                    
                    nvrResult = await client.query(updateQuery, [
                      createdBranch.id,
                      nvrData.device_name,
                      nvrData.hostname,
                      nvrData.processor || null,
                      nvrData.ram || null,
                      nvrData.device_id || null,
                      nvrData.product_id || null,
                      nvrData.system_type || null,
                      nvrData.securos_version || null,
                      nvrData.ip_address,
                      nvrData.max_cameras || 16,
                      currentCameras,
                      'online',
                      99.0,
                      nvrData.installation_date || null,
                      nvrData.maintenance_period_days || 90,
                      nvrData.warranty_expiry || null,
                      existingNvr.rows[0].id
                    ]);
                  } else {
                    // Create new NVR
                    const insertQuery = `
                      INSERT INTO nvrs (
                        branch_id, device_name, hostname, processor, ram, device_id,
                        product_id, system_type, securos_version, ip_address, max_cameras,
                        current_cameras, status, uptime_percent, installation_date,
                        maintenance_period_days, warranty_expiry, is_active,
                        created_at, updated_at
                      )
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                      RETURNING id, device_name, hostname;
                    `;
                    
                    nvrResult = await client.query(insertQuery, [
                      createdBranch.id,
                      nvrData.device_name,
                      nvrData.hostname,
                      nvrData.processor || null,
                      nvrData.ram || null,
                      nvrData.device_id || null,
                      nvrData.product_id || null,
                      nvrData.system_type || null,
                      nvrData.securos_version || null,
                      nvrData.ip_address,
                      nvrData.max_cameras || 16,
                      currentCameras,
                      'online',
                      99.0,
                      nvrData.installation_date || null,
                      nvrData.maintenance_period_days || 90,
                      nvrData.warranty_expiry || null,
                      true
                    ]);
                  }


                  const createdNVR = nvrResult.rows[0];
                  summary.nvrs++;
                  console.log(`✅ NVR created/updated: ${createdNVR.device_name} (${createdNVR.hostname})`);

                  // 4. Create NVR Storage configuration  
                  if (nvrData.storage) {
                    const storageQuery = `
                      INSERT INTO nvr_storage (
                        nvr_id, storage_total_gb, storage_used_gb, storage_percent,
                        created_at, updated_at
                      )
                      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
                    `;

                    const storagePercent = nvrData.storage.storage_total_gb > 0 
                      ? (nvrData.storage.storage_used_gb / nvrData.storage.storage_total_gb * 100).toFixed(2)
                      : 0;

                    await client.query(storageQuery, [
                      createdNVR.id,
                      nvrData.storage.storage_total_gb || 0,
                      nvrData.storage.storage_used_gb || 0,
                      parseFloat(storagePercent)
                    ]);

                    summary.storage_configs++;
                  }

                  // 5. Process Cameras for this NVR
                  if (nvrData.cameras && Array.isArray(nvrData.cameras)) {
                    for (const cameraData of nvrData.cameras) {
                      try {
                        // Create Camera
                        const cameraQuery = `
                          INSERT INTO cameras (
                            nvr_id, branch_id, name, position, ip_address, model,
                            manufacturer, resolution, fps, bitrate, edge_storage_size, edge_storage_retention,
                            status, uptime_percent, created_at, updated_at
                          )
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                          ON CONFLICT (name)
                          DO UPDATE SET 
                            position = EXCLUDED.position,
                            ip_address = EXCLUDED.ip_address,
                            model = EXCLUDED.model,
                            manufacturer = EXCLUDED.manufacturer,
                            resolution = EXCLUDED.resolution,
                            fps = EXCLUDED.fps,
                            bitrate = EXCLUDED.bitrate,
                            edge_storage_size = EXCLUDED.edge_storage_size,
                            edge_storage_retention = EXCLUDED.edge_storage_retention,
                            status = EXCLUDED.status,
                            updated_at = CURRENT_TIMESTAMP
                          RETURNING id, name;
                        `;

                        const cameraResult = await client.query(cameraQuery, [
                          createdNVR.id,
                          createdBranch.id,
                          cameraData.name,
                          cameraData.position,
                          cameraData.ip_address,
                          cameraData.model || null,
                          cameraData.manufacturer || null,
                          cameraData.resolution || null,
                          cameraData.fps || 25,
                          cameraData.bitrate || null,
                          cameraData.edge_storage_size || null,
                          cameraData.edge_storage_retention || null,
                          cameraData.status || 'online',
                          99.0 // Default uptime
                        ]);

                        const createdCamera = cameraResult.rows[0];
                        summary.cameras++;

                        // Create Camera Uptime record (camera_uptime doesn't have unique constraint on camera_id, so insert directly)
                        await client.query(`
                          INSERT INTO camera_uptime (camera_id, status, last_seen, created_at, updated_at)
                          VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `, [createdCamera.id, cameraData.status || 'online']);

                        console.log(`✅ Camera created/updated: ${createdCamera.name}`);

                      } catch (cameraError) {
                        console.error(`❌ Camera creation failed: ${cameraData.name}`, cameraError.message);
                        summary.errors.push(`Camera ${cameraData.name}: ${cameraError.message}`);
                      }
                    }
                  }

                } catch (nvrError) {
                  console.error(`❌ NVR creation failed: ${nvrData.device_name}`, nvrError.message);
                  summary.errors.push(`NVR ${nvrData.device_name}: ${nvrError.message}`);
                }
              }
            }

          } catch (branchError) {
            console.error(`❌ Branch creation failed: ${branchData.name}`, branchError.message);
            summary.errors.push(`Branch ${branchData.name}: ${branchError.message}`);
          }
        }
      }

      await client.query('COMMIT'); // Commit transaction

      console.log('🎉 Initialization completed successfully!');
      console.log(`📊 Summary: ${summary.regions} regions, ${summary.branches} branches, ${summary.nvrs} NVRs, ${summary.cameras} cameras`);

      res.status(200).json({
        success: true,
        message: 'System initialization completed successfully',
        summary: summary,
        region: {
          id: createdRegion.id,
          name: createdRegion.name,
          code: createdRegion.code
        }
      });

    } catch (error) {
      await client.query('ROLLBACK'); // Rollback transaction
      console.error('❌ Initialization failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Initialization failed',
        message: error.message,
        details: error.stack
      });
    } finally {
      await client.end();
    }
  }

  /**
   * GET /api/initialize/schema
   * Returns the JSON schema for the initialization API
   */
  async getSchema(req, res) {
    const schema = {
      type: "object",
      required: ["region"],
      properties: {
        region: {
          type: "object",
          required: ["name", "code"],
          properties: {
            name: { type: "string", description: "Region display name" },
            code: { type: "string", pattern: "^[A-Z]{2,5}$", description: "Unique region code (2-5 uppercase letters)" },
            description: { type: "string", description: "Optional region description" },
            coordinates: { 
              type: "object",
              properties: {
                lat: { type: "number", minimum: -90, maximum: 90 },
                lng: { type: "number", minimum: -180, maximum: 180 }
              }
            },
            timezone: { type: "string", default: "Asia/Riyadh" },
            branches: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "branch_code", "address"],
                properties: {
                  name: { type: "string" },
                  branch_code: { type: "string", pattern: "^[A-Z]{2,5}-\\d{3}$" },
                  branch_type: { type: "string", enum: ["Main Branch", "Branch", "ATM"] },
                  address: { type: "string" },
                  coordinates: { 
                    type: "object",
                    properties: {
                      lat: { type: "number" },
                      lng: { type: "number" }
                    }
                  },
                  contact_phone: { type: "string" },
                  manager_name: { type: "string" },
                  operating_hours: { type: "object" },
                  nvrs: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["device_name", "hostname", "ip_address"],
                      properties: {
                        device_name: { type: "string", pattern: "^[A-Z]+-[A-Z0-9]+-\\d{3}-\\d{2}$" },
                        hostname: { type: "string", pattern: "^[A-Z0-9-]+$" },
                        processor: { type: "string" },
                        ram: { type: "string" },
                        device_id: { type: "string" },
                        product_id: { type: "string" },
                        system_type: { type: "string" },
                        securos_version: { type: "string" },
                        ip_address: { type: "string", format: "ipv4" },
                        max_cameras: { type: "integer", minimum: 1, maximum: 64, default: 16 },
                        installation_date: { type: "string", format: "date" },
                        maintenance_period_days: { type: "integer", minimum: 7, default: 90 },
                        warranty_expiry: { type: "string", format: "date" },
                        storage: {
                          type: "object",
                          properties: {
                            storage_total_gb: { type: "integer", minimum: 0 },
                            storage_used_gb: { type: "integer", minimum: 0 }
                          }
                        },
                        cameras: {
                          type: "array",
                          items: {
                            type: "object",
                            required: ["name", "position", "ip_address"],
                            properties: {
                              name: { type: "string", pattern: "^CAM-[A-Z0-9]+-\\d{3}-\\d{2}$" },
                              position: { type: "string" },
                              ip_address: { type: "string", format: "ipv4" },
                              model: { type: "string" },
                              manufacturer: { type: "string" },
                              resolution: { type: "string" },
                              fps: { type: "integer", minimum: 1, maximum: 60, default: 25 },
                              bitrate: { type: "integer", minimum: 0 },
                              edge_storage_size: { type: "integer", minimum: 0 },
                              edge_storage_retention: { type: "integer", minimum: 0 },
                              status: { type: "string", enum: ["online", "offline", "warning", "error"], default: "online" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    res.json({
      success: true,
      schema: schema,
      example: {
        region: {
          name: "Riyadh Region",
          code: "RD",
          description: "Main region covering Riyadh area",
          coordinates: { lat: 24.7136, lng: 46.6753 },
          timezone: "Asia/Riyadh",
          branches: [{
            name: "Main Branch Riyadh",
            branch_code: "RD-001",
            branch_type: "Main Branch",
            address: "King Fahd Road, Riyadh",
            coordinates: { lat: 24.7136, lng: 46.6753 },
            contact_phone: "+966-11-XXXXXX",
            manager_name: "Ahmad Al-Saudi",
            operating_hours: {
              weekdays: "08:00-17:00",
              weekend: "closed"
            },
            nvrs: [{
              device_name: "NVR-RD-001-01",
              hostname: "DESKTOP-T7MNQIA",
              processor: "Intel i7-8700",
              ram: "32GB DDR4",
              device_id: "HIK-123456",
              product_id: "DS-7616NI-K2",
              system_type: "Hikvision NVR System",
              securos_version: "v4.3.1",
              ip_address: "192.168.1.100",
              max_cameras: 16,
              installation_date: "2024-01-15",
              maintenance_period_days: 90,
              warranty_expiry: "2026-01-15",
              storage: {
                storage_total_gb: 8000,
                storage_used_gb: 2400
              },
              cameras: [{
                name: "CAM-RD-001-01",
                position: "Main Entrance",
                ip_address: "192.168.1.101",
                model: "DS-2CD2142FWD-I",
                manufacturer: "Hikvision",
                resolution: "4MP",
                fps: 25,
                bitrate: 6144,
                edge_storage_size: 128,
                status: "online"
              }]
            }]
          }]
        }
      }
    });
  }

  /**
   * GET /api/initialize/status
   * Returns current system status for initialization
   */
  async getSystemStatus(req, res) {
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'vms_dashboard',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });

    try {
      await client.connect();

      const queries = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM regions'),
        client.query('SELECT COUNT(*) as count FROM branches'),
        client.query('SELECT COUNT(*) as count FROM nvrs'),
        client.query('SELECT COUNT(*) as count FROM cameras'),
        client.query('SELECT COUNT(*) as count FROM nvr_storage'),
        client.query('SELECT r.name as region, COUNT(b.id) as branches FROM regions r LEFT JOIN branches b ON r.id = b.region_id GROUP BY r.id, r.name ORDER BY r.name'),
        client.query('SELECT COUNT(DISTINCT hostname) as unique_hostnames, COUNT(*) as total_nvrs FROM nvrs')
      ]);

      const status = {
        database_populated: true,
        counts: {
          regions: parseInt(queries[0].rows[0].count),
          branches: parseInt(queries[1].rows[0].count),
          nvrs: parseInt(queries[2].rows[0].count),
          cameras: parseInt(queries[3].rows[0].count),
          storage_configs: parseInt(queries[4].rows[0].count)
        },
        regions_breakdown: queries[5].rows,
        hostname_validation: {
          unique_hostnames: parseInt(queries[6].rows[0].unique_hostnames),
          total_nvrs: parseInt(queries[6].rows[0].total_nvrs),
          all_unique: queries[6].rows[0].unique_hostnames === queries[6].rows[0].total_nvrs
        },
        ready_for_initialization: true
      };

      res.json({
        success: true,
        status: status
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get system status',
        message: error.message
      });
    } finally {
      await client.end();
    }
  }
}

module.exports = new InitializationController();
