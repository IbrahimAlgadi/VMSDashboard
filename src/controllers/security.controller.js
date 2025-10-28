const { SecurityEvent, Branch, Region } = require('../models');
const MOCK_DATA = require('../config/constants');

class SecurityController {
  // GET /security
  async showSecurity(req, res) {
    try {
      console.log('Security controller called');
      
      // Simple query first to test
      const eventCount = await SecurityEvent.count().catch((error) => {
        console.error('SecurityEvent count error:', error);
        return 0;
      });
      
      console.log(`Total security events in database: ${eventCount}`);
      
      if (eventCount === 0) {
        console.log('No events found, using mock data');
        res.render('security', {
          title: 'Security Monitoring',
          currentPage: 'security',
          data: MOCK_DATA.security
        });
        return;
      }

      // Get all security events with related data
      const events = await SecurityEvent.findAll({
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
          include: [{
            model: Region,
            as: 'region',
            attributes: ['id', 'name']
          }]
        }],
        order: [['created_at', 'DESC']],
        limit: 500
      }).catch((error) => {
        console.error('SecurityEvent query error:', error);
        return [];
      });

      console.log(`Found ${events.length} security events`);

      if (events.length > 0) {
        // Calculate overview statistics
        const totalEvents = events.length;
        const activeEvents = events.filter(e => e.status === 'active').length;
        const resolvedEvents = events.filter(e => e.status === 'resolved').length;
        
        // Calculate security score based on severity and status
        const criticalActive = events.filter(e => e.severity === 'critical' && e.status === 'active').length;
        const highActive = events.filter(e => e.severity === 'high' && e.status === 'active').length;
        const mediumActive = events.filter(e => e.severity === 'medium' && e.status === 'active').length;
        
        // Security score calculation (higher is better)
        let securityScore = 100;
        securityScore -= criticalActive * 20; // -20 points per critical active
        securityScore -= highActive * 10;     // -10 points per high active
        securityScore -= mediumActive * 5;    // -5 points per medium active
        securityScore = Math.max(0, securityScore);

        // Determine threat level
        let threatLevel = 'Low';
        if (criticalActive > 0 || highActive > 5) {
          threatLevel = 'Critical';
        } else if (highActive > 2 || mediumActive > 10) {
          threatLevel = 'High';
        } else if (highActive > 0 || mediumActive > 5) {
          threatLevel = 'Medium';
        }

        // Group events by device type and event type for security checks
        const createSecurityChecks = (events, deviceType) => {
          const deviceEvents = events.filter(e => e.device_type === deviceType);
          
          // Map event types to security check categories
          const checkMapping = {
            'weak_password': {
              name: 'Weak Passwords',
              description: `${deviceType === 'camera' ? 'Cameras' : 'NVRs'} using weak or default passwords`,
              severity: 'critical'
            },
            'http_access': {
              name: 'Insecure HTTP Access',
              description: `${deviceType === 'camera' ? 'Cameras' : 'NVRs'} accessible over insecure HTTP protocol`,
              severity: 'high'
            },
            'tls_missing': {
              name: 'TLS Missing',
              description: `${deviceType === 'camera' ? 'Cameras' : 'NVRs'} not using TLS encryption`,
              severity: 'high'
            },
            'audit_logging': {
              name: 'Audit Logging',
              description: `${deviceType === 'camera' ? 'Cameras' : 'NVRs'} with audit logging enabled`,
              severity: 'high'
            },
            'audit_disabled': {
              name: 'Audit Disabled',
              description: `${deviceType === 'camera' ? 'Cameras' : 'NVRs'} with audit logging disabled`,
              severity: 'medium'
            },
            'firmware_outdated': {
              name: 'Firmware Outdated',
              description: `${deviceType === 'camera' ? 'Cameras' : 'NVRs'} running outdated firmware`,
              severity: 'medium'
            }
          };

          const checks = {};
          
          deviceEvents.forEach(event => {
            const checkInfo = checkMapping[event.event_type];
            if (!checkInfo) return;

            if (!checks[event.event_type]) {
              checks[event.event_type] = {
                id: event.event_type,
                name: checkInfo.name,
                description: checkInfo.description,
                severity: checkInfo.severity,
                passed: 0,
                failed: 0,
                total: 0
              };
            }

            checks[event.event_type].total++;
            if (event.status === 'resolved') {
              checks[event.event_type].passed++;
            } else {
              checks[event.event_type].failed++;
            }
          });

          // Convert to array and calculate compliance
          return Object.values(checks).map(check => ({
            ...check,
            compliance: check.total > 0 ? Math.round((check.passed / check.total) * 100) : 100
          })).sort((a, b) => b.compliance - a.compliance);
        };

        const cameraSecurityChecks = createSecurityChecks(events, 'camera');
        const nvrSecurityChecks = createSecurityChecks(events, 'nvr');

        // Get recent events (last 20)
        const recentSecurityEvents = events.slice(0, 20).map(event => ({
          id: event.id,
          type: event.event_type,
          severity: event.severity,
          device: event.device_name || `Unknown ${event.device_type}`,
          deviceType: event.device_type,
          message: event.message,
          timestamp: event.created_at,
          status: event.status,
          branch: event.branch?.name || 'Unknown'
        }));

        // Structure data for frontend
        const data = {
          overview: {
            securityScore: Math.round(securityScore),
            totalChecks: totalEvents,
            passed: resolvedEvents,
            failed: activeEvents,
            threatLevel: threatLevel
          },
          cameraSecurityChecks: cameraSecurityChecks,
          nvrSecurityChecks: nvrSecurityChecks,
          recentSecurityEvents: recentSecurityEvents
        };

        res.render('security', {
          title: 'Security Monitoring',
          currentPage: 'security',
          data: data
        });
      } else {
        // Fallback to mock data
        res.render('security', {
          title: 'Security Monitoring',
          currentPage: 'security',
          data: MOCK_DATA.security
        });
      }
    } catch (error) {
      console.error('Error loading security events:', error);
      res.render('security', {
        title: 'Security Monitoring',
        currentPage: 'security',
        data: MOCK_DATA.security
      });
    }
  }
}

module.exports = new SecurityController();
