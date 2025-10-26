const { NVR, Branch } = require('../models');
const MOCK_DATA = require('../config/constants');

class NVRController {
  // GET /nvr-management
  async showNVRManagement(req, res) {
    try {
      const nvrs = await NVR.findAll({
        include: [{
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }],
        where: { is_active: true },
        order: [['device_name', 'ASC']]
      }).catch(() => []);

      // Transform database results to frontend format
      const transformedNVRs = nvrs.length > 0 ? nvrs.map(nvr => ({
        id: nvr.id,
        name: nvr.device_name,
        location: nvr.branch?.name || 'Unknown',
        ipAddress: nvr.ip_address,
        status: nvr.status || 'offline',
        uptime: parseFloat(nvr.uptime_percent) || 0,
        cameras: {
          current: nvr.current_cameras || 0,
          max: nvr.max_cameras || 16
        },
        storage: {
          percent: 0, // TODO: Calculate from actual storage data when available
          used: '0 GB',
          total: '0 GB'
        },
        lastSeen: nvr.last_seen ? new Date(nvr.last_seen).toISOString() : null,
        branch: {
          id: nvr.branch_id,
          name: nvr.branch?.name || 'Unknown'
        }
      })) : [];

      // Calculate statistics
      const summary = transformedNVRs.length > 0 ? {
        total: transformedNVRs.length,
        online: transformedNVRs.filter(n => n.status === 'online').length,
        offline: transformedNVRs.filter(n => n.status === 'offline').length,
        warning: transformedNVRs.filter(n => n.status === 'warning').length
      } : (MOCK_DATA.nvrs.summary || { total: 0, online: 0, offline: 0, warning: 0 });

      // Use database data if available, otherwise use mock data
      const nvrList = transformedNVRs.length > 0 ? transformedNVRs : MOCK_DATA.nvrs.nvrs || [];

      res.render('nvr-management', {
        title: 'NVR Management',
        currentPage: 'nvr-management',
        nvrs: nvrList,
        summary: summary
      });
    } catch (error) {
      console.error('Error loading NVRs:', error);
      // Fallback to mock data
      res.render('nvr-management', {
        title: 'NVR Management',
        currentPage: 'nvr-management',
        nvrs: MOCK_DATA.nvrs.nvrs || [],
        summary: MOCK_DATA.nvrs.summary || { total: 0, online: 0, offline: 0, warning: 0 }
      });
    }
  }
}

module.exports = new NVRController();
