const { Alert, Branch, Region, User } = require('../models');
const MOCK_DATA = require('../config/constants');

class AlertController {
  // GET /alerts
  async showAlerts(req, res) {
    try {
      console.log('Alerts controller called');
      
      // Get all alerts with related data
      const alerts = await Alert.findAll({
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name'],
            include: [{
              model: Region,
              as: 'region',
              attributes: ['id', 'name']
            }]
          },
          {
            model: User,
            as: 'acknowledgedBy',
            attributes: ['id', 'full_name'],
            required: false
          },
          {
            model: User,
            as: 'resolvedBy',
            attributes: ['id', 'full_name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 500
      }).catch((error) => {
        console.error('Alert query error:', error);
        return [];
      });

      console.log(`Found ${alerts.length} alerts`);

      if (alerts.length > 0) {
        // Calculate summary statistics
        const totalAlerts = alerts.length;
        const criticalCount = alerts.filter(a => a.severity === 'critical').length;
        const highCount = alerts.filter(a => a.severity === 'high').length;
        const mediumCount = alerts.filter(a => a.severity === 'medium').length;
        const lowCount = alerts.filter(a => a.severity === 'low').length;
        
        const unreadCount = alerts.filter(a => a.status === 'active').length;
        const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
        const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

        // Transform alerts to frontend format
        const transformedAlerts = alerts.map(alert => {
          // Map database type to frontend type
          const typeMapping = {
            'camera_offline': 'System',
            'nvr_offline': 'System',
            'storage_warning': 'Storage',
            'motion_detected': 'Security',
            'network_issue': 'Network',
            'maintenance': 'Maintenance',
            'security': 'Security',
            'system_error': 'System',
            'power_issue': 'System',
            'firmware_update': 'Maintenance'
          };

          // Map database status to frontend status
          const statusMapping = {
            'active': 'unread',
            'acknowledged': 'acknowledged',
            'resolved': 'resolved',
            'dismissed': 'resolved'
          };

          // Generate actions based on alert type and status
          const generateActions = (alert) => {
            const actions = [];
            if (alert.status === 'active') {
              actions.push('Acknowledge');
            }
            if (alert.type === 'camera_offline' || alert.type === 'nvr_offline') {
              actions.push('Restart Device', 'Check Connection');
            }
            if (alert.type === 'storage_warning') {
              actions.push('Expand Storage', 'Archive Footage');
            }
            if (alert.type === 'motion_detected' || alert.type === 'security') {
              actions.push('Investigate', 'Review Footage');
            }
            if (alert.status === 'acknowledged') {
              actions.push('Resolve', 'Assign Technician');
            }
            return actions;
          };

          return {
            id: alert.id,
            timestamp: alert.created_at,
            title: alert.title,
            description: alert.message,
            severity: alert.severity,
            type: typeMapping[alert.type] || 'System',
            location: alert.branch?.name || 'Unknown Location',
            source: alert.source_type === 'camera' ? `CAM-${alert.source_id}` : 
                   alert.source_type === 'nvr' ? `NVR-${alert.source_id}` : 
                   alert.source_type === 'system' ? 'System' : 'Unknown',
            status: statusMapping[alert.status] || 'unread',
            assignedTo: alert.acknowledgedBy?.full_name || null,
            actions: generateActions(alert)
          };
        });

        // Structure data for frontend
        const data = {
          summary: {
            total: totalAlerts,
            critical: criticalCount,
            high: highCount,
            medium: mediumCount,
            low: lowCount,
            unread: unreadCount,
            acknowledged: acknowledgedCount,
            resolved: resolvedCount
          },
          alerts: transformedAlerts
        };

        res.render('alerts', {
          title: 'Alerts Management',
          currentPage: 'alerts',
          data: data
        });
      } else {
        // Fallback to mock data
        res.render('alerts', {
          title: 'Alerts Management',
          currentPage: 'alerts',
          data: MOCK_DATA.alerts
        });
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      res.render('alerts', {
        title: 'Alerts Management',
        currentPage: 'alerts',
        data: MOCK_DATA.alerts
      });
    }
  }
}

module.exports = new AlertController();
