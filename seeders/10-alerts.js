const { 
  generateTimestamps, 
  randomChoice, 
  randomInt, 
  generateAlertMessage,
  alertTemplates 
} = require('./utils/helpers');

class AlertsSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // Get required data from database
    const [usersResult, branchesResult, camerasResult, nvrsResult] = await Promise.all([
      this.db.query('SELECT id, username, role FROM users WHERE is_active = true ORDER BY id'),
      this.db.query('SELECT id, name, branch_code FROM branches ORDER BY id'),
      this.db.query('SELECT id, name, branch_id FROM cameras ORDER BY id'),
      this.db.query('SELECT id, device_name, branch_id FROM nvrs ORDER BY id')
    ]);

    const users = usersResult.rows;
    const branches = branchesResult.rows;
    const cameras = camerasResult.rows;
    const nvrs = nvrsResult.rows;

    if (branches.length === 0) {
      throw new Error('No branches found. Please run branches seeder first.');
    }

    const alerts = [];
    const alertTypes = Object.keys(alertTemplates);
    
    // Generate alerts over the past 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Generate different types of alerts
    const alertConfigs = [
      // Critical alerts (fewer but high priority)
      {
        count: randomInt(8, 15),
        types: ['camera_offline', 'nvr_offline'],
        severities: ['critical'],
        statuses: ['active', 'acknowledged', 'resolved']
      },
      // Storage warnings (common)
      {
        count: randomInt(20, 35),
        types: ['storage_warning'],
        severities: ['medium', 'high'],
        statuses: ['active', 'acknowledged', 'resolved']
      },
      // Motion detection alerts
      {
        count: randomInt(50, 80),
        types: ['motion_detected'],
        severities: ['info', 'low'],
        statuses: ['active', 'resolved', 'dismissed']
      },
      // Network issues
      {
        count: randomInt(15, 25),  
        types: ['network_issue'],
        severities: ['medium', 'high'],
        statuses: ['active', 'acknowledged', 'resolved']
      },
      // System maintenance
      {
        count: randomInt(10, 20),
        types: ['maintenance'],
        severities: ['info', 'low'],
        statuses: ['resolved']
      }
    ];

    for (const config of alertConfigs) {
      for (let i = 0; i < config.count; i++) {
        const alertType = randomChoice(config.types);
        const severity = randomChoice(config.severities);
        const status = randomChoice(config.statuses);
        
        // Select appropriate source based on alert type
        let sourceType, sourceId, deviceName, branchId;
        
        if (alertType === 'camera_offline' || alertType === 'motion_detected') {
          sourceType = 'camera';
          if (cameras.length > 0) {
            const camera = randomChoice(cameras);
            sourceId = camera.id;
            deviceName = camera.name;
            branchId = camera.branch_id;
          }
        } else if (alertType === 'nvr_offline' || alertType === 'storage_warning') {
          sourceType = 'nvr';
          if (nvrs.length > 0) {
            const nvr = randomChoice(nvrs);
            sourceId = nvr.id;
            deviceName = nvr.device_name;
            branchId = nvr.branch_id;
          }
        } else {
          sourceType = randomChoice(['system', 'network']);
          branchId = randomChoice(branches).id;
        }

        // Generate appropriate message
        let message, title;
        if (alertType === 'storage_warning') {
          const percentage = randomInt(80, 95);
          message = generateAlertMessage(alertType, deviceName, percentage);
          title = `Storage Warning - ${percentage}%`;
        } else {
          message = generateAlertMessage(alertType, deviceName);
          title = this.generateAlertTitle(alertType, deviceName);
        }

        // Generate timestamps
        const createdAt = new Date(thirtyDaysAgo.getTime() + 
          Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
        
        let acknowledgedAt = null;
        let acknowledgedBy = null;
        let resolvedAt = null;
        let resolvedBy = null;
        let resolutionNotes = null;
        let autoResolve = false;

        // Handle status-specific fields
        if (status === 'acknowledged' || status === 'resolved') {
          acknowledgedAt = new Date(createdAt.getTime() + randomInt(5, 120) * 60 * 1000);
          acknowledgedBy = randomChoice(users.filter(u => u.role !== 'viewer')).id;
        }

        if (status === 'resolved') {
          resolvedAt = new Date(acknowledgedAt.getTime() + randomInt(10, 480) * 60 * 1000);
          resolvedBy = randomChoice(users.filter(u => ['admin', 'operator', 'technician'].includes(u.role))).id;
          resolutionNotes = this.generateResolutionNotes(alertType);
          
          // Some alerts auto-resolve
          if (alertType === 'motion_detected' || Math.random() < 0.2) {
            autoResolve = true;
          }
        }

        const alert = {
          branch_id: branchId,
          acknowledged_by: acknowledgedBy,
          resolved_by: resolvedBy,
          title: title,
          message: message,
          type: alertType,
          severity: severity,
          source_type: sourceType,
          source_id: sourceId,
          status: status,
          acknowledged_at: acknowledgedAt ? acknowledgedAt.toISOString() : null,
          resolved_at: resolvedAt ? resolvedAt.toISOString() : null,
          resolution_notes: resolutionNotes,
          auto_resolve: autoResolve,
          created_at: createdAt.toISOString(),
          updated_at: (resolvedAt || acknowledgedAt || createdAt).toISOString()
        };

        alerts.push(alert);
      }
    }

    // Sort alerts by creation time (newest first)
    alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const result = await this.db.insertBatch('alerts', alerts, 'DO NOTHING');
    
    // Generate summary statistics
    const stats = {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      dismissed: alerts.filter(a => a.status === 'dismissed').length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    };
    
    return {
      summary: `Created ${result.length} alerts - Status: active(${stats.active}), resolved(${stats.resolved}), acknowledged(${stats.acknowledged}) - Severity: critical(${stats.critical}), high(${stats.high}), medium(${stats.medium}), low(${stats.low})`
    };
  }

  generateAlertTitle(alertType, deviceName) {
    const titles = {
      camera_offline: `Camera Offline${deviceName ? ` - ${deviceName}` : ''}`,
      nvr_offline: `NVR Connection Lost${deviceName ? ` - ${deviceName}` : ''}`,
      storage_warning: `Storage Warning${deviceName ? ` - ${deviceName}` : ''}`,
      motion_detected: 'Motion Detection Alert',
      network_issue: 'Network Connectivity Issue',
      maintenance: 'Scheduled Maintenance',
      security: 'Security Alert',
      system_error: 'System Error Detected',
      power_issue: 'Power Fluctuation Detected',
      firmware_update: 'Firmware Update Available'
    };

    return titles[alertType] || 'System Alert';
  }

  generateResolutionNotes(alertType) {
    const resolutionNotes = {
      camera_offline: [
        'Camera restored after network cable replacement',
        'Power cycle resolved the issue',
        'Firmware update applied successfully',
        'Network configuration corrected'
      ],
      nvr_offline: [
        'NVR system restarted successfully',
        'Network connectivity restored',
        'Power supply issue resolved',
        'Hardware maintenance completed'
      ],
      storage_warning: [
        'Old recordings archived and deleted',
        'Additional storage capacity added',
        'Retention policy adjusted',
        'Storage cleanup completed'
      ],
      motion_detected: [
        'False alarm - cleaning crew confirmed',
        'Authorized personnel verified',
        'Motion sensitivity adjusted',
        'Normal business activity'
      ],
      network_issue: [
        'ISP connection restored',
        'Network equipment restarted',
        'Bandwidth allocation optimized',
        'Router configuration updated'
      ],
      maintenance: [
        'Scheduled maintenance completed successfully',
        'All systems verified operational',
        'Maintenance window closed',
        'System performance optimized'
      ]
    };

    const notes = resolutionNotes[alertType] || ['Issue resolved'];
    return randomChoice(notes);
  }
}

module.exports = AlertsSeeder;
