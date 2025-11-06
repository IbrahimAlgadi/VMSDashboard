/**
 * Validation utilities for API endpoints
 */

/**
 * Validates initialization data structure
 * @param {Object} data - The initialization data object
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
function validateInitializationData(data) {
  const errors = [];

  // Check if data exists and has region
  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format: expected object');
    return { isValid: false, errors };
  }

  if (!data.region) {
    errors.push('Missing required field: region');
    return { isValid: false, errors };
  }

  const { region } = data;

  // Validate region
  if (!region.name || typeof region.name !== 'string') {
    errors.push('Region name is required and must be a string');
  }

  if (!region.code || typeof region.code !== 'string') {
    errors.push('Region code is required and must be a string');
  } else if (!/^[A-Z]{2,5}$/.test(region.code)) {
    errors.push('Region code must be 2-5 uppercase letters');
  }

  if (region.coordinates && typeof region.coordinates !== 'object') {
    errors.push('Region coordinates must be an object with lat/lng');
  }

  // Validate branches array
  if (region.branches) {
    if (!Array.isArray(region.branches)) {
      errors.push('Branches must be an array');
    } else {
      region.branches.forEach((branch, branchIndex) => {
        const branchPrefix = `Branch ${branchIndex + 1}`;

        if (!branch.name || typeof branch.name !== 'string') {
          errors.push(`${branchPrefix}: name is required and must be a string`);
        }

        if (!branch.branch_code || typeof branch.branch_code !== 'string') {
          errors.push(`${branchPrefix}: branch_code is required and must be a string`);
        } else if (!/^[A-Z]{2,5}-\d{3}$/.test(branch.branch_code)) {
          errors.push(`${branchPrefix}: branch_code must match pattern XX-000 (e.g., RD-001)`);
        }

        if (!branch.address || typeof branch.address !== 'string') {
          errors.push(`${branchPrefix}: address is required and must be a string`);
        }

        if (branch.branch_type && !['Main Branch', 'Branch', 'ATM'].includes(branch.branch_type)) {
          errors.push(`${branchPrefix}: branch_type must be one of: Main Branch, Branch, ATM`);
        }

        // Validate NVRs array
        if (branch.nvrs) {
          if (!Array.isArray(branch.nvrs)) {
            errors.push(`${branchPrefix}: nvrs must be an array`);
          } else {
            branch.nvrs.forEach((nvr, nvrIndex) => {
              const nvrPrefix = `${branchPrefix} NVR ${nvrIndex + 1}`;

              if (!nvr.device_name || typeof nvr.device_name !== 'string') {
                errors.push(`${nvrPrefix}: device_name is required and must be a string`);
              }

              if (!nvr.hostname || typeof nvr.hostname !== 'string') {
                errors.push(`${nvrPrefix}: hostname is required and must be a string`);
              } else if (!/^[A-Z0-9-]+$/.test(nvr.hostname)) {
                errors.push(`${nvrPrefix}: hostname must contain only uppercase letters, numbers, and hyphens`);
              }

              if (!nvr.ip_address || typeof nvr.ip_address !== 'string') {
                errors.push(`${nvrPrefix}: ip_address is required and must be a string`);
              } else if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(nvr.ip_address)) {
                errors.push(`${nvrPrefix}: ip_address must be a valid IPv4 address`);
              }

              if (nvr.max_cameras && (typeof nvr.max_cameras !== 'number' || nvr.max_cameras < 1 || nvr.max_cameras > 64)) {
                errors.push(`${nvrPrefix}: max_cameras must be a number between 1 and 64`);
              }

              // Validate cameras array
              if (nvr.cameras) {
                if (!Array.isArray(nvr.cameras)) {
                  errors.push(`${nvrPrefix}: cameras must be an array`);
                } else {
                  nvr.cameras.forEach((camera, cameraIndex) => {
                    const cameraPrefix = `${nvrPrefix} Camera ${cameraIndex + 1}`;

                    if (!camera.name || typeof camera.name !== 'string') {
                      errors.push(`${cameraPrefix}: name is required and must be a string`);
                    }

                    if (!camera.position || typeof camera.position !== 'string') {
                      errors.push(`${cameraPrefix}: position is required and must be a string`);
                    }

                    if (!camera.ip_address || typeof camera.ip_address !== 'string') {
                      errors.push(`${cameraPrefix}: ip_address is required and must be a string`);
                    } else if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(camera.ip_address)) {
                      errors.push(`${cameraPrefix}: ip_address must be a valid IPv4 address`);
                    }

                    if (camera.fps && (typeof camera.fps !== 'number' || camera.fps < 1 || camera.fps > 60)) {
                      errors.push(`${cameraPrefix}: fps must be a number between 1 and 60`);
                    }

                    if (camera.status && !['online', 'offline', 'warning', 'error'].includes(camera.status)) {
                      errors.push(`${cameraPrefix}: status must be one of: online, offline, warning, error`);
                    }
                  });
                }
              }
            });
          }
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates IP address format
 * @param {string} ip - IP address string
 * @returns {boolean}
 */
function isValidIPAddress(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

/**
 * Validates hostname format
 * @param {string} hostname - Hostname string
 * @returns {boolean}
 */
function isValidHostname(hostname) {
  // Allow alphanumeric characters and hyphens, must start and end with alphanumeric
  const hostnameRegex = /^[A-Z0-9]([A-Z0-9-]*[A-Z0-9])?$/;
  return hostnameRegex.test(hostname) && hostname.length <= 50;
}

/**
 * Validates device name format
 * @param {string} deviceName - Device name string
 * @returns {boolean}
 */
function isValidDeviceName(deviceName) {
  // Format: TYPE-REGION-BRANCH-NUMBER (e.g., NVR-RD-001-01, CAM-RD-001-01)
  const deviceNameRegex = /^[A-Z]+-[A-Z0-9]+-\d{3}-\d{2}$/;
  return deviceNameRegex.test(deviceName);
}

/**
 * Validates branch code format
 * @param {string} branchCode - Branch code string
 * @returns {boolean}
 */
function isValidBranchCode(branchCode) {
  // Format: REGION-NUMBER (e.g., RD-001, JD-025)
  const branchCodeRegex = /^[A-Z]{2,5}-\d{3}$/;
  return branchCodeRegex.test(branchCode);
}

/**
 * Sanitizes and validates coordinates
 * @param {Object} coordinates - Coordinates object with lat/lng
 * @returns {Object|null}
 */
function validateCoordinates(coordinates) {
  if (!coordinates || typeof coordinates !== 'object') {
    return null;
  }

  const { lat, lng } = coordinates;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}

/**
 * Validates if a value is a valid numeric ID
 * @param {string|number} id - ID value to validate
 * @returns {boolean}
 */
function isValidNumericId(id) {
  // Check if it's already a number
  if (typeof id === 'number') {
    return Number.isInteger(id) && id > 0;
  }
  
  // Check if it's a string that can be converted to a positive integer
  if (typeof id === 'string') {
    const numId = parseInt(id, 10);
    return !isNaN(numId) && numId > 0 && numId.toString() === id.trim();
  }
  
  return false;
}

/**
 * Calculate NVR status based on its cameras' statuses
 * @param {Object} NVR - NVR model
 * @param {Object} Camera - Camera model  
 * @param {number} nvrId - NVR ID to calculate status for
 * @returns {Promise<string>} - Calculated NVR status
 */
async function calculateNVRStatus(NVR, Camera, nvrId) {
  try {
    // Find all cameras for this NVR
    const cameras = await Camera.findAll({
      where: { nvr_id: nvrId },
      attributes: ['id', 'status']
    });

    if (cameras.length === 0) {
      // No cameras -> NVR should be offline or warning
      return 'warning';
    }

    // Count camera statuses
    const statusCounts = {
      online: cameras.filter(c => c.status === 'online').length,
      offline: cameras.filter(c => c.status === 'offline').length,
      warning: cameras.filter(c => c.status === 'warning').length,
      maintenance: cameras.filter(c => c.status === 'maintenance').length
    };

    // Determine NVR status based on camera statuses
    if (statusCounts.offline === cameras.length) {
      // All cameras are offline -> NVR warning (NVR might still be functioning)
      return 'warning';
    } else if (statusCounts.warning > 0 || statusCounts.offline > 0 || statusCounts.maintenance > 0) {
      // Some cameras have issues -> NVR warning
      return 'warning'; 
    } else if (statusCounts.online === cameras.length) {
      // All cameras online -> NVR online
      return 'online';
    } else {
      // Default to warning for any unknown states
      return 'warning';
    }

  } catch (error) {
    console.error('Error calculating NVR status:', error);
    return 'warning'; // Default to warning on error
  }
}

/**
 * Update NVR status based on its cameras' statuses
 * @param {Object} NVR - NVR model
 * @param {Object} Camera - Camera model
 * @param {number} nvrId - NVR ID to update
 * @param {boolean} forceRecalculate - Force recalculation even if NVR is offline (default: false)
 * @returns {Promise<boolean>} - Success status
 */
async function updateNVRStatus(NVR, Camera, nvrId, forceRecalculate = false) {
  try {
    // Check current NVR status first
    const currentNVR = await NVR.findOne({
      where: { id: nvrId },
      attributes: ['status']
    });

    if (!currentNVR) {
      console.error(`NVR ${nvrId} not found`);
      return false;
    }

    // If NVR is already marked as 'offline', it means the hardware is disconnected
    // Don't recalculate based on camera statuses unless forced
    if (currentNVR.status === 'offline' && !forceRecalculate) {
      console.log(`NVR ${nvrId} is offline (hardware disconnected), preserving status`);
      return false; // Status unchanged, but not an error
    }

    const calculatedStatus = await calculateNVRStatus(NVR, Camera, nvrId);
    
    // Only update if status actually changed
    if (calculatedStatus !== currentNVR.status) {
      await NVR.update(
        { status: calculatedStatus },
        { where: { id: nvrId } }
      );
      console.log(`Updated NVR ${nvrId} status: ${currentNVR.status} → ${calculatedStatus}`);
      return true;
    } else {
      console.log(`NVR ${nvrId} status unchanged: ${calculatedStatus}`);
      return false; // Status unchanged, but not an error
    }
  } catch (error) {
    console.error('Error updating NVR status:', error);
    return false;
  }
}

/**
 * Validates comprehensive camera data structure
 * @param {Object} data - The comprehensive camera data object
 * @returns {Object} - {isValid: boolean, errors: string[], warnings: string[]}
 */
function validateComprehensiveData(data) {
  const errors = [];
  const warnings = [];

  // Basic structure validation
  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format: expected object');
    return { isValid: false, errors, warnings };
  }

  // Required sections
  const requiredSections = ['metadata', 'analysis'];
  for (const section of requiredSections) {
    if (!data[section]) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  // Metadata validation
  if (data.metadata) {
    const { metadata } = data;
    
    if (!metadata.camera || typeof metadata.camera !== 'string') {
      errors.push('metadata.camera is required and must be a string');
    } else {
      // Extract IP from camera field (format: "192.168.0.111:443")
      const ipMatch = metadata.camera.match(/^(\d+\.\d+\.\d+\.\d+)/);
      if (!ipMatch || !isValidIPAddress(ipMatch[1])) {
        errors.push('metadata.camera must contain a valid IP address');
      }
    }

    if (!metadata.timestamp) {
      errors.push('metadata.timestamp is required');
    } else if (isNaN(new Date(metadata.timestamp))) {
      errors.push('metadata.timestamp must be a valid ISO date string');
    }

    if (metadata.nvr_hostname && typeof metadata.nvr_hostname !== 'string') {
      warnings.push('metadata.nvr_hostname should be a string');
    }
  }

  // ONVIF data validation (optional but validate if present)
  if (data.onvifData) {
    if (data.onvifData.deviceInfo) {
      const { deviceInfo } = data.onvifData;
      if (!deviceInfo.manufacturer || !deviceInfo.model) {
        warnings.push('ONVIF device info missing manufacturer or model');
      }
    }
  }

  // Web scraping data validation (optional but validate if present)
  if (data.webScrapingData) {
    const { webScrapingData } = data;
    
    if (webScrapingData.systemLogs && !Array.isArray(webScrapingData.systemLogs.logs)) {
      warnings.push('webScrapingData.systemLogs.logs should be an array');
    }
    
    if (webScrapingData.recordingStatus && !Array.isArray(webScrapingData.recordingStatus.recordings)) {
      warnings.push('webScrapingData.recordingStatus.recordings should be an array');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Extracts camera IP address from metadata
 * @param {Object} metadata - Metadata object
 * @returns {string|null} - Extracted IP address or null
 */
function extractCameraIP(metadata) {
  if (!metadata?.camera) return null;
  
  const ipMatch = metadata.camera.match(/^(\d+\.\d+\.\d+\.\d+)/);
  return ipMatch ? ipMatch[1] : null;
}

/**
 * Process comprehensive camera data
 * @param {Object} comprehensiveData - Full camera data object
 * @returns {Object} - Processed data object
 */
function processComprehensiveData(comprehensiveData) {
  return {
    basicInfo: extractBasicInfo(comprehensiveData),
    healthMetrics: calculateHealthMetrics(comprehensiveData),
    networkInfo: extractNetworkInfo(comprehensiveData),
    alerts: processSystemLogs(comprehensiveData),
    status: determineCameraStatus(comprehensiveData),
    metadata: extractExtendedMetadata(comprehensiveData)
  };
}

/**
 * Extract basic camera information for Camera table
 */
function extractBasicInfo(data) {
  const onvifDevice = data.onvifData?.deviceInfo;
  const profiles = data.onvifData?.profiles || [];
  
  // Extract model
  const model = onvifDevice?.model || null;
  
  // Extract primary profile (highest resolution profile)
  const primaryProfile = getPrimaryProfile(profiles);
  
  // Extract resolution
  let resolution = null;
  if (primaryProfile?.videoEncoderConfiguration?.resolution) {
    const res = primaryProfile.videoEncoderConfiguration.resolution;
    resolution = `${res.width}x${res.height}`;
  }
  
  // Extract frame rate
  let fps = null;
  if (primaryProfile?.videoEncoderConfiguration?.rateControl?.frameRateLimit) {
    fps = primaryProfile.videoEncoderConfiguration.rateControl.frameRateLimit;
  }
  
  // Extract bitrate from primary profile
  let bitrate = null;
  if (primaryProfile?.videoEncoderConfiguration?.rateControl?.bitrateLimit) {
    bitrate = primaryProfile.videoEncoderConfiguration.rateControl.bitrateLimit;
  }
  
  return {
    manufacturer: onvifDevice?.manufacturer || null,
    model: model,
    resolution: resolution,
    fps: fps,
    bitrate: bitrate,
    streamQuality: primaryProfile?.videoEncoderConfiguration?.quality || null,
    encoding: primaryProfile?.videoEncoderConfiguration?.encoding || null,
    updated_at: new Date()
  };
}

/**
 * Get primary profile (highest resolution)
 */
function getPrimaryProfile(profiles) {
  if (!profiles || profiles.length === 0) {
    return null;
  }
  
  // Find profile with highest resolution
  let primaryProfile = profiles[0];
  let maxPixels = 0;
  
  profiles.forEach(profile => {
    const res = profile?.videoEncoderConfiguration?.resolution;
    if (res) {
      const pixels = res.width * res.height;
      if (pixels > maxPixels) {
        maxPixels = pixels;
        primaryProfile = profile;
      }
    }
  });
  
  return primaryProfile;
}

/**
 * Calculate health metrics from various data sources
 */
function calculateHealthMetrics(data) {
  const recordings = data.webScrapingData?.recordingStatus?.recordings || [];
  const sdCard = data.webScrapingData?.sdCardStatus?.sdCards?.[0];
  const services = data.webScrapingData?.networkServices?.services || [];
  const logs = data.webScrapingData?.systemLogs?.logs || [];
  const recordingConfigs = data.onvifData?.recordingConfigurations || [];
  
  // Calculate storage information
  let storageTotalGb = 0;
  let spaceUsedGb = 0;
  let edgeStorageSizeGb = 0;
  
  // Extract SD card storage
  if (sdCard?.size) {
    const sizeMatch = sdCard.size.match(/(\d+)\s*MB/);
    if (sizeMatch) {
      storageTotalGb = parseFloat(sizeMatch[1]) / 1024; // Convert MB to GB
      edgeStorageSizeGb = storageTotalGb; // Edge storage is SD card size
    }
  }
  
  // Extract recording retention information
  let retentionSeconds = 0;
  let retentionDays = 30; // Default
  if (recordingConfigs.length > 0) {
    // Find active recording configuration (non-zero retention)
    const activeRecording = recordingConfigs.find(rec => {
      const retentionTime = rec?.configuration?.maximumRetentionTime || '';
      return retentionTime !== 'PT0S' && retentionTime !== '';
    });
    
    if (activeRecording?.configuration?.maximumRetentionTime) {
      const retentionStr = activeRecording.configuration.maximumRetentionTime;
      // Parse ISO 8601 duration (PT259200S = 259200 seconds)
      const secondsMatch = retentionStr.match(/(\d+)S/);
      if (secondsMatch) {
        retentionSeconds = parseInt(secondsMatch[1]);
        retentionDays = Math.floor(retentionSeconds / 86400); // Convert to days
      }
    }
  }
  
  // Calculate bitrate from active recordings
  let bitrateKbps = 0;
  const activeRecording = recordings.find(r => r.status !== 'Offline');
  if (activeRecording?.ramBufferBitRate) {
    bitrateKbps = parseInt(activeRecording.ramBufferBitRate) || 0;
  }
  
  // Calculate quality score based on various factors
  let qualityScore = 100;
  
  // Penalize for offline recordings
  const offlineRecordings = recordings.filter(r => r.status === 'Offline').length;
  if (offlineRecordings === recordings.length && recordings.length > 0) {
    qualityScore -= 40; // All recordings offline
  } else if (offlineRecordings > 0) {
    qualityScore -= 20; // Some recordings offline
  }
  
  // Check critical network services
  const criticalServices = ['HTTP', 'HTTPS', 'RTSP'];
  const enabledCriticalServices = services.filter(s => 
    criticalServices.includes(s.name) && s.status === 'enabled'
  ).length;
  
  if (enabledCriticalServices < 2) {
    qualityScore -= 25; // Critical services offline
  }
  
  // Check for recent log entries and adjust quality score accordingly
  const now = new Date();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  
  const recentLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate > dayAgo && !log.message.includes('System starting');
  });
  
  // Count logs by priority
  const emergencyLogs = recentLogs.filter(log => log.priority === 'EMERGENCY').length;
  const alertLogs = recentLogs.filter(log => log.priority === 'ALERT').length;
  const warningLogs = recentLogs.filter(log => log.priority === 'WARNING').length;
  const infoLogs = recentLogs.filter(log => log.priority === 'INFO').length;
  
  // Adjust quality score based on log severity and frequency
  if (emergencyLogs > 0) {
    qualityScore -= 30; // Emergency logs significantly impact health
  }
  if (alertLogs > 0) {
    qualityScore -= 20; // Alert logs have high impact
  }
  if (warningLogs > 3) {
    qualityScore -= 15; // Multiple warnings indicate issues
  } else if (warningLogs > 0) {
    qualityScore -= 5; // Single warning has minor impact
  }
  if (infoLogs > 10) {
    qualityScore -= 5; // Too many info logs might indicate system instability
  }
  
  // Calculate storage usage estimate based on bitrate and retention
  if (storageTotalGb > 0 && bitrateKbps > 0) {
    // Estimate: storage used based on bitrate and retention period
    const bitrateMbps = bitrateKbps / 1000;
    const hoursOfRecording = retentionDays * 24;
    const estimatedUsedGb = (bitrateMbps * hoursOfRecording) / 8; // Convert Mbps*hours to GB
    spaceUsedGb = Math.min(estimatedUsedGb, storageTotalGb); // Cap at total storage
  }
  
  return {
    bitrate_kbps: bitrateKbps,
    space_used_gb: spaceUsedGb,
    storage_total_gb: storageTotalGb,
    edge_storage_size_gb: edgeStorageSizeGb,
    quality_score: Math.max(0, qualityScore),
    retention_days: retentionDays,
    retention_seconds: retentionSeconds,
    last_health_check: new Date(),
    // Network metrics would need actual ping tests
    ping_ms: 0,
    packet_loss_percent: 0,
    bandwidth_mbps: 0,
    frame_drop_percent: 0,
    recording_time_days: retentionDays,
    motion_events_today: 0, // Would need motion detection logs
    alerts_pending: emergencyLogs + alertLogs + (warningLogs > 0 ? 1 : 0), // Count critical alerts
    is_active: true
  };
}

/**
 * Extract network information
 */
function extractNetworkInfo(data) {
  const networkInterface = data.onvifData?.networkInterfaces?.[0];
  const protocols = data.onvifData?.networkProtocols?.networkProtocols || [];
  const services = data.webScrapingData?.networkServices?.services || [];
  
  return {
    interface: networkInterface,
    protocols: protocols,
    services: services,
    mac_address: networkInterface?.info?.hwAddress,
    mtu: networkInterface?.info?.MTU,
    link_speed: networkInterface?.link?.operSettings?.speed,
    duplex: networkInterface?.link?.operSettings?.duplex
  };
}

/**
 * Process system logs and create alert objects
 */
function processSystemLogs(data) {
  const logs = data.webScrapingData?.systemLogs?.logs || [];
  const alerts = [];
  
  // Process logs based on priority and recency
  const now = new Date();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  logs.forEach(log => {
    const logDate = new Date(log.timestamp);
    
    // Skip system startup messages
    if (log.message.includes('System starting')) {
      return;
    }
    
    // Determine if we should process this log based on priority and age
    let shouldProcess = false;
    let timeThreshold = dayAgo;
    
    switch (log.priority) {
      case 'EMERGENCY':
        // Process emergency logs from last 24 hours
        shouldProcess = logDate > dayAgo;
        break;
      case 'ALERT':
        // Process alert logs from last 24 hours
        shouldProcess = logDate > dayAgo;
        break;
      case 'WARNING':
        // Process warning logs from last 7 days (but only recent ones)
        shouldProcess = logDate > dayAgo;
        break;
      case 'INFO':
        // Process info logs from last 24 hours (only for specific modules)
        const infoModules = ['storage', 'configuration', 'network'];
        shouldProcess = logDate > dayAgo && infoModules.includes(log.module);
        break;
      default:
        shouldProcess = false;
    }
    
    if (!shouldProcess) {
      return;
    }
    
    // Create alert with appropriate severity and type
    alerts.push({
      title: `Camera ${log.priority}: ${log.module}`,
      message: log.message,
      type: mapLogModuleToAlertType(log.module),
      severity: mapLogPriorityToSeverity(log.priority),
      source_type: 'camera',
      status: 'active',
      priority: log.priority,
      module: log.module,
      timestamp: logDate,
      user: log.user,
      // Add additional context for different priorities
      context: getLogContext(log)
    });
  });
  
  return alerts;
}

/**
 * Get additional context for log entries
 */
function getLogContext(log) {
  const context = {
    original_priority: log.priority,
    log_timestamp: log.timestamp,
    processing_timestamp: new Date().toISOString()
  };
  
  // Add specific context based on module
  switch (log.module) {
    case 'storage':
      context.storage_event = true;
      if (log.message.includes('SD-Card')) {
        context.storage_type = 'sd_card';
      }
      break;
    case 'configuration':
      context.config_event = true;
      if (log.message.includes('preset')) {
        context.config_type = 'video_preset';
      } else if (log.message.includes('retention')) {
        context.config_type = 'recording_retention';
      }
      break;
    case 'config_intern':
      context.internal_config_event = true;
      break;
    case 'system':
      context.system_event = true;
      break;
    case 'network':
      context.network_event = true;
      break;
  }
  
  return context;
}

/**
 * Map log module to alert type
 */
function mapLogModuleToAlertType(module) {
  const mapping = {
    'storage': 'storage_warning',
    'configuration': 'system_error',
    'config_intern': 'system_error',
    'system': 'system_error',
    'network': 'network_issue',
    'security': 'security'
  };
  return mapping[module] || 'system_error';
}

/**
 * Map log priority to alert severity
 */
function mapLogPriorityToSeverity(priority) {
  const mapping = {
    'EMERGENCY': 'critical',
    'ALERT': 'high',
    'WARNING': 'medium',
    'INFO': 'low'
  };
  return mapping[priority] || 'medium';
}

/**
 * Determine camera status based on comprehensive data
 */
function determineCameraStatus(data) {
  const recordings = data.webScrapingData?.recordingStatus?.recordings || [];
  const services = data.webScrapingData?.networkServices?.services || [];
  const logs = data.webScrapingData?.systemLogs?.logs || [];
  
  // Check for emergency conditions (last hour)
  const recentEmergencyLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return logDate > hourAgo && log.priority === 'EMERGENCY' && 
           !log.message.includes('System starting');
  });
  
  if (recentEmergencyLogs.length > 0) {
    return 'offline';
  }
  
  // Check for multiple alert-level issues (last 6 hours)
  const recentAlertLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const hoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    return logDate > hoursAgo && log.priority === 'ALERT' && 
           !log.message.includes('System starting');
  });
  
  if (recentAlertLogs.length > 2) {
    return 'offline';
  }
  
  // Check critical network services
  const criticalServices = ['HTTP', 'RTSP'];
  const enabledCriticalServices = services.filter(s => 
    criticalServices.includes(s.name) && s.status === 'enabled'
  );
  
  if (enabledCriticalServices.length === 0) {
    return 'offline';
  }
  
  // Check recording status
  const activeRecordings = recordings.filter(r => r.status !== 'Offline');
  
  if (activeRecordings.length === 0 && recordings.length > 0) {
    return 'warning'; // Recordings configured but offline
  }
  
  // Check for warning-level issues (last 6 hours)
  const recentWarningLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const hoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    return logDate > hoursAgo && log.priority === 'WARNING' && 
           !log.message.includes('System starting');
  });
  
  if (recentWarningLogs.length > 5) {
    return 'warning';
  }
  
  // Check for configuration issues (multiple config changes)
  const recentConfigLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const hoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return logDate > hoursAgo && 
           (log.module === 'configuration' || log.module === 'config_intern') &&
           !log.message.includes('System starting');
  });
  
  if (recentConfigLogs.length > 3) {
    return 'warning';
  }
  
  return 'online';
}

/**
 * Extract extended metadata for storage
 */
function extractExtendedMetadata(data) {
  const profiles = data.onvifData?.profiles || [];
  const recordingConfigs = data.onvifData?.recordingConfigurations || [];
  const streamUris = data.onvifData?.streamUris || [];
  
  // Extract profile information
  const profileInfo = profiles.map(profile => ({
    token: profile.$?.token,
    name: profile.name,
    resolution: profile.videoEncoderConfiguration?.resolution,
    frameRate: profile.videoEncoderConfiguration?.rateControl?.frameRateLimit,
    bitrate: profile.videoEncoderConfiguration?.rateControl?.bitrateLimit,
    quality: profile.videoEncoderConfiguration?.quality,
    encoding: profile.videoEncoderConfiguration?.encoding
  }));
  
  // Extract recording configuration info
  const recordingInfo = recordingConfigs.map(rec => ({
    recordingToken: rec.recordingToken,
    retentionTime: rec.configuration?.maximumRetentionTime,
    tracks: rec.tracks?.track?.length || 0
  }));
  
  return {
    onvif_data: {
      deviceInfo: data.onvifData?.deviceInfo,
      networkInterfaces: data.onvifData?.networkInterfaces,
      networkProtocols: data.onvifData?.networkProtocols,
      profiles: profileInfo,
      recordingConfigurations: recordingInfo,
      streamUris: streamUris
    },
    collection_info: {
      timestamp: data.metadata?.timestamp,
      methods: data.metadata?.collectionMethods,
      nvr_hostname: data.metadata?.nvr_hostname,
      total_data_sources: data.metadata?.totalDataSources
    },
    latest_status: {
      recording_summary: {
        total_recordings: data.webScrapingData?.recordingStatus?.totalRecordings,
        active_recordings: data.webScrapingData?.recordingStatus?.recordings?.filter(r => r.status !== 'Offline').length || 0
      },
      storage_summary: {
        sd_card_present: data.webScrapingData?.sdCardStatus?.availableCards > 0,
        total_slots: data.webScrapingData?.sdCardStatus?.totalSlots,
        card_manufacturer: data.webScrapingData?.sdCardStatus?.sdCards?.[0]?.manufacturer,
        card_size: data.webScrapingData?.sdCardStatus?.sdCards?.[0]?.size,
        card_state: data.webScrapingData?.sdCardStatus?.sdCards?.[0]?.state
      },
      services_summary: {
        total_services: data.webScrapingData?.networkServices?.totalServices,
        enabled_services: data.webScrapingData?.networkServices?.services?.filter(s => s.status === 'enabled').length || 0
      }
    },
    last_updated: new Date()
  };
}

module.exports = {
  validateInitializationData,
  isValidIPAddress,
  isValidHostname,
  isValidDeviceName,
  isValidBranchCode,
  validateCoordinates,
  isValidNumericId,
  calculateNVRStatus,
  updateNVRStatus,
  validateComprehensiveData,
  extractCameraIP,
  processComprehensiveData
};
