const { 
  generateTimestamps, 
  randomChoice, 
  randomInt, 
  randomIP 
} = require('./utils/helpers');

class SecurityEventsSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // Get required data from database
    const [usersResult, branchesResult, camerasResult, nvrsResult] = await Promise.all([
      this.db.query('SELECT id, username, role FROM users WHERE is_active = true ORDER BY id'),
      this.db.query('SELECT id, name FROM branches ORDER BY id'),
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

    const events = [];
    
    // Generate security events over the past 60 days
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Define event configurations
    const eventConfigs = [
      {
        count: randomInt(15, 25),
        eventType: 'weak_password',
        severity: 'critical',
        deviceTypes: ['camera', 'nvr'],
        statuses: ['active', 'resolved']
      },
      {
        count: randomInt(10, 18),
        eventType: 'http_access',
        severity: 'high',
        deviceTypes: ['camera', 'nvr'],
        statuses: ['active', 'resolved']
      },
      {
        count: randomInt(8, 15),
        eventType: 'firmware_outdated',
        severity: 'medium',
        deviceTypes: ['camera', 'nvr'],
        statuses: ['active', 'resolved']
      },
      {
        count: randomInt(12, 20),
        eventType: 'audit_logging',
        severity: 'high',
        deviceTypes: ['camera', 'nvr'],
        statuses: ['active', 'resolved']
      },
      {
        count: randomInt(5, 10),
        eventType: 'unauthorized_access',
        severity: 'critical',
        deviceTypes: ['system'],
        statuses: ['active', 'investigating', 'resolved']
      },
      {
        count: randomInt(8, 12),
        eventType: 'tls_missing',
        severity: 'high',
        deviceTypes: ['nvr'],
        statuses: ['active', 'resolved']
      },
      {
        count: randomInt(6, 12),
        eventType: 'audit_disabled',
        severity: 'medium',
        deviceTypes: ['camera', 'nvr'],
        statuses: ['resolved']
      }
    ];

    for (const config of eventConfigs) {
      for (let i = 0; i < config.count; i++) {
        const deviceType = randomChoice(config.deviceTypes);
        const status = randomChoice(config.statuses);
        
        // Select appropriate device and branch
        let deviceId = null;
        let deviceName = null;
        let branchId;
        
        if (deviceType === 'camera' && cameras.length > 0) {
          const camera = randomChoice(cameras);
          deviceId = camera.id;
          deviceName = camera.name;
          branchId = camera.branch_id;
        } else if (deviceType === 'nvr' && nvrs.length > 0) {
          const nvr = randomChoice(nvrs);
          deviceId = nvr.id;
          deviceName = nvr.device_name;
          branchId = nvr.branch_id;
        } else {
          // System-level event
          branchId = randomChoice(branches).id;
          deviceName = 'System';
        }

        // Generate event details
        const { title, message } = this.generateEventDetails(config.eventType, deviceName);
        
        // Generate timestamps
        const createdAt = new Date(sixtyDaysAgo.getTime() + 
          Math.random() * (now.getTime() - sixtyDaysAgo.getTime()));
        
        let assignedTo = null;
        let resolvedBy = null;
        let resolvedAt = null;
        let resolutionNotes = null;

        // Handle status-specific fields
        if (status === 'investigating' || status === 'resolved') {
          assignedTo = randomChoice(users.filter(u => ['admin', 'operator', 'technician'].includes(u.role))).id;
        }

        if (status === 'resolved') {
          resolvedAt = new Date(createdAt.getTime() + randomInt(30, 1440) * 60 * 1000); // 30 minutes to 24 hours later
          resolvedBy = randomChoice(users.filter(u => ['admin', 'technician'].includes(u.role))).id;
          resolutionNotes = this.generateResolutionNotes(config.eventType);
        }

        const event = {
          branch_id: branchId,
          assigned_to: assignedTo,
          resolved_by: resolvedBy,
          event_type: config.eventType,
          severity: config.severity,
          device_type: deviceType,
          device_id: deviceId,
          device_name: deviceName,
          title: title,
          message: message,
          source_ip: Math.random() < 0.7 ? randomIP() : null,
          detection_method: randomChoice(['automatic', 'manual', 'external']),
          status: status,
          resolved_at: resolvedAt ? resolvedAt.toISOString() : null,
          resolution_notes: resolutionNotes,
          created_at: createdAt.toISOString(),
          updated_at: (resolvedAt || createdAt).toISOString()
        };

        events.push(event);
      }
    }

    // Sort events by creation time (newest first)
    events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const result = await this.db.insertBatch('security_events', events, 'DO NOTHING');
    
    // Generate summary statistics
    const stats = {
      total: events.length,
      active: events.filter(e => e.status === 'active').length,
      investigating: events.filter(e => e.status === 'investigating').length,
      resolved: events.filter(e => e.status === 'resolved').length,
      critical: events.filter(e => e.severity === 'critical').length,
      high: events.filter(e => e.severity === 'high').length,
      medium: events.filter(e => e.severity === 'medium').length
    };
    
    return {
      summary: `Created ${result.length} security events - Status: active(${stats.active}), investigating(${stats.investigating}), resolved(${stats.resolved}) - Severity: critical(${stats.critical}), high(${stats.high}), medium(${stats.medium})`
    };
  }

  generateEventDetails(eventType, deviceName) {
    const templates = {
      weak_password: {
        title: `Weak Password Detected${deviceName ? ` - ${deviceName}` : ''}`,
        messages: [
          'Default or weak password detected on device',
          'Password policy violation detected',
          'Insecure authentication credentials found'
        ]
      },
      http_access: {
        title: `Insecure HTTP Access${deviceName ? ` - ${deviceName}` : ''}`,
        messages: [
          'Device accessible over insecure HTTP protocol',
          'Unencrypted web interface detected',
          'HTTP access without proper security'
        ]
      },
      firmware_outdated: {
        title: `Outdated Firmware${deviceName ? ` - ${deviceName}` : ''}`,
        messages: [
          'Device running outdated firmware version',
          'Security patches not applied',
          'Firmware update required for security compliance'
        ]
      },
      audit_logging: {
        title: `Audit Logging Issue${deviceName ? ` - ${deviceName}` : ''}`,
        messages: [
          'Audit logging not properly configured',
          'Missing security audit trails',
          'Incomplete logging configuration detected'
        ]
      },
      unauthorized_access: {
        title: 'Unauthorized Access Attempt',
        messages: [
          'Multiple failed login attempts detected',
          'Suspicious access pattern identified',
          'Potential security breach attempt'
        ]
      },
      tls_missing: {
        title: `TLS Configuration Missing${deviceName ? ` - ${deviceName}` : ''}`,
        messages: [
          'TLS 1.2+ not enabled for secure communication',
          'Insecure data transmission detected',
          'Encryption protocols not properly configured'
        ]
      },
      audit_disabled: {
        title: `Audit Logging Disabled${deviceName ? ` - ${deviceName}` : ''}`,
        messages: [
          'Security audit logging has been disabled',
          'Device audit trail not being recorded',
          'Logging functionality requires activation'
        ]
      }
    };

    const template = templates[eventType];
    if (template) {
      return {
        title: template.title,
        message: randomChoice(template.messages)
      };
    }

    return {
      title: `Security Event${deviceName ? ` - ${deviceName}` : ''}`,
      message: 'Security policy violation detected'
    };
  }

  generateResolutionNotes(eventType) {
    const resolutions = {
      weak_password: [
        'Password policy updated and enforced',
        'Strong passwords configured on all devices',
        'Default credentials changed successfully'
      ],
      http_access: [
        'HTTPS enabled and HTTP disabled',
        'Secure protocols configured',
        'Web interface security enhanced'
      ],
      firmware_outdated: [
        'Firmware updated to latest secure version',
        'Security patches applied successfully',
        'Device software brought up to compliance'
      ],
      audit_logging: [
        'Comprehensive audit logging enabled',
        'Log configuration corrected',
        'Security monitoring activated'
      ],
      unauthorized_access: [
        'Access controls tightened',
        'IP address blocked',
        'Security incident investigated and resolved'
      ],
      tls_missing: [
        'TLS 1.2+ enabled for all communications',
        'Encryption protocols updated',
        'Secure communication channels established'
      ],
      audit_disabled: [
        'Audit logging re-enabled',
        'Security monitoring restored',
        'Logging configuration verified'
      ]
    };

    const notes = resolutions[eventType] || ['Security issue resolved'];
    return randomChoice(notes);
  }
}

module.exports = SecurityEventsSeeder;
