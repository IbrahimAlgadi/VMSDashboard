const { generateTimestamps } = require('./utils/helpers');

class ComplianceRequirementsSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    const requirements = [
      // Camera Requirements
      {
        code: 'CAM_RESOLUTION_5MP',
        name: 'Camera Resolution (5 MP)',
        description: 'All cameras must have minimum 5MP resolution for clear image capture',
        category: 'camera',
        applies_to: 'camera',
        required_value: '5MP',
        check_method: 'automatic',
        check_frequency: 'daily',
        severity: 'high',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'CAM_UPTIME_99',
        name: 'Camera Uptime (≥99%)',
        description: 'Camera uptime must be 99% or higher to ensure continuous monitoring',
        category: 'camera',
        applies_to: 'camera',
        required_value: '99.0',
        check_method: 'automatic',
        check_frequency: 'hourly',
        severity: 'critical',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'CAM_RECORDING_ON',
        name: 'Camera Recording Enabled',
        description: 'All cameras must have recording functionality enabled',
        category: 'camera',
        applies_to: 'camera',
        required_value: 'true',
        check_method: 'automatic',
        check_frequency: 'daily',
        severity: 'critical',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'CAM_NIGHT_VISION',
        name: 'Night Vision Capability',
        description: 'Cameras in 24/7 locations must have night vision capability',
        category: 'camera',
        applies_to: 'camera',
        required_value: 'true',
        check_method: 'manual',
        check_frequency: 'monthly',
        severity: 'medium',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'CAM_MOTION_DETECTION',
        name: 'Motion Detection',
        description: 'Motion detection must be enabled for security monitoring',
        category: 'camera',
        applies_to: 'camera',
        required_value: 'true',
        check_method: 'automatic',
        check_frequency: 'daily',
        severity: 'medium',
        is_active: true,
        ...generateTimestamps(120)
      },

      // NVR Requirements
      {
        code: 'NVR_FIRMWARE_LATEST',
        name: 'NVR Firmware Version',
        description: 'NVR firmware must be v4.2.1 or higher for security and stability',
        category: 'nvr',
        applies_to: 'nvr',
        required_value: 'v4.2.1',
        check_method: 'automatic',
        check_frequency: 'weekly',
        severity: 'high',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'NVR_STORAGE_16TB',
        name: 'NVR Storage Size (16TB)',
        description: 'NVR storage must be at least 16TB for adequate retention',
        category: 'storage',
        applies_to: 'nvr',
        required_value: '16TB',
        check_method: 'automatic',
        check_frequency: 'monthly',
        severity: 'medium',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'NVR_UPTIME_99',
        name: 'NVR Uptime (≥99%)',
        description: 'NVR uptime must be 99% or higher for reliable operation',
        category: 'nvr',
        applies_to: 'nvr',
        required_value: '99.0',
        check_method: 'automatic',
        check_frequency: 'hourly',
        severity: 'critical',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'NVR_REDUNDANCY',
        name: 'NVR Redundancy Configuration',
        description: 'Critical locations must have NVR redundancy setup',
        category: 'nvr',
        applies_to: 'nvr',
        required_value: 'configured',
        check_method: 'manual',
        check_frequency: 'monthly',
        severity: 'high',
        is_active: true,
        ...generateTimestamps(120)
      },

      // Storage Requirements
      {
        code: 'STORAGE_RETAIN_30D',
        name: 'Storage Retention (30 Days)',
        description: 'Video recordings must be retained for minimum 30 days',
        category: 'storage',
        applies_to: 'both',
        required_value: '30',
        check_method: 'automatic',
        check_frequency: 'daily',
        severity: 'critical',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'STORAGE_USAGE_80',
        name: 'Storage Usage (<80%)',
        description: 'Storage usage must not exceed 80% to prevent data loss',
        category: 'storage',
        applies_to: 'nvr',
        required_value: '80',
        check_method: 'automatic',
        check_frequency: 'daily',
        severity: 'high',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'STORAGE_BACKUP_ON',
        name: 'Storage Backup Configuration',
        description: 'Automatic backup must be configured for critical recordings',
        category: 'storage',
        applies_to: 'nvr',
        required_value: 'enabled',
        check_method: 'manual',
        check_frequency: 'weekly',
        severity: 'medium',
        is_active: true,
        ...generateTimestamps(120)
      },

      // Network Requirements
      {
        code: 'NET_BANDWIDTH_MIN',
        name: 'Network Bandwidth (Min 10Mbps)',
        description: 'Minimum 10Mbps bandwidth required for quality video streaming',
        category: 'network',
        applies_to: 'both',
        required_value: '10',
        check_method: 'automatic',
        check_frequency: 'daily',
        severity: 'medium',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'NETWORK_LATENCY_MAX',
        name: 'Network Latency (<100ms)',
        description: 'Network latency must be under 100ms for real-time monitoring',
        category: 'network',
        applies_to: 'both',
        required_value: '100',
        check_method: 'automatic',
        check_frequency: 'hourly',
        severity: 'medium',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'NETWORK_REDUNDANCY',
        name: 'Network Redundancy',
        description: 'Critical locations must have redundant network connections',
        category: 'network',
        applies_to: 'both',
        required_value: 'configured',
        check_method: 'manual',
        check_frequency: 'monthly',
        severity: 'high',
        is_active: true,
        ...generateTimestamps(120)
      },

      // Security Requirements
      {
        code: 'SEC_STRONG_PASSWORDS',
        name: 'Strong Password Policy',
        description: 'All devices must use strong passwords (min 12 chars, mixed case, numbers, symbols)',
        category: 'security',
        applies_to: 'both',
        required_value: 'compliant',
        check_method: 'automatic',
        check_frequency: 'weekly',
        severity: 'critical',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'SEC_HTTPS_ONLY',
        name: 'HTTPS Only Access',
        description: 'All device access must use HTTPS encryption',
        category: 'security',
        applies_to: 'both',
        required_value: 'https',
        check_method: 'automatic',
        check_frequency: 'daily',
        severity: 'high',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'SEC_AUDIT_LOGGING',
        name: 'Audit Logging Enabled',
        description: 'Comprehensive audit logging must be enabled for all devices',
        category: 'security',
        applies_to: 'both',
        required_value: 'enabled',
        check_method: 'automatic',
        check_frequency: 'daily',
        severity: 'high',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'SEC_ACCESS_CONTROL',
        name: 'Role-Based Access Control',
        description: 'Devices must implement role-based access control',
        category: 'security',
        applies_to: 'both',
        required_value: 'rbac',
        check_method: 'manual',
        check_frequency: 'monthly',
        severity: 'high',
        is_active: true,
        ...generateTimestamps(120)
      },

      // Maintenance Requirements
      {
        code: 'MAINT_SCHEDULE_Q',
        name: 'Quarterly Maintenance Schedule',
        description: 'All devices must undergo quarterly preventive maintenance',
        category: 'maintenance',
        applies_to: 'both',
        required_value: '90',
        check_method: 'manual',
        check_frequency: 'monthly',
        severity: 'medium',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'MAINT_FW_UPDATES',
        name: 'Regular Firmware Updates',
        description: 'Firmware must be updated within 30 days of security releases',
        category: 'maintenance',
        applies_to: 'both',
        required_value: '30',
        check_method: 'automatic',
        check_frequency: 'weekly',
        severity: 'high',
        is_active: true,
        ...generateTimestamps(120)
      },
      {
        code: 'MAINT_HEALTH_MON',
        name: 'Device Health Monitoring',
        description: 'Continuous health monitoring must be enabled for all devices',
        category: 'maintenance',
        applies_to: 'both',
        required_value: 'enabled',
        check_method: 'automatic',
        check_frequency: 'daily',
        severity: 'medium',
        is_active: true,
        ...generateTimestamps(120)
      }
    ];

    const result = await this.db.insertBatch('compliance_requirements', requirements, 'DO NOTHING');
    
    const categorySummary = {};
    requirements.forEach(req => {
      categorySummary[req.category] = (categorySummary[req.category] || 0) + 1;
    });

    const summaryStr = Object.entries(categorySummary)
      .map(([category, count]) => `${category}(${count})`)
      .join(', ');
    
    return {
      summary: `Created ${result.length} compliance requirements across categories: ${summaryStr}`
    };
  }
}

module.exports = ComplianceRequirementsSeeder;
