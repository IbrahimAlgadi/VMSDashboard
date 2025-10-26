const { NVR, Camera, Branch, Alert } = require('../models');
const MOCK_DATA = require('../config/constants');

class DashboardController {
  // GET /
  async showDashboard(req, res) {
    try {
      // Try to get real data from database
      const [totalNVRs, totalCameras, totalBranches, onlineNVRs, onlineCameras, recentAlerts] = await Promise.all([
        NVR.count({ where: { is_active: true } }).catch((e) => { console.error('NVR count error:', e.message); return 0; }),
        Camera.count().catch((e) => { console.error('Camera count error:', e.message); return 0; }),
        Branch.count({ where: { is_active: true } }).catch((e) => { console.error('Branch count error:', e.message); return 0; }),
        NVR.count({ where: { is_active: true, status: 'online' } }).catch(() => 0),
        Camera.count().catch(() => 0), // Count all cameras for now
        Alert.findAll({
          where: { status: 'active' },
          order: [['created_at', 'DESC']],
          limit: 3,
          include: [{ model: Branch, as: 'branch' }]
        }).catch(() => [])
      ]);

      console.log(`📊 Dashboard Data: NVRs=${totalNVRs}, Cameras=${totalCameras}, Branches=${totalBranches}`);

      // Check if we have database data or need to use mock data
      // Use database data if we have any meaningful count (> 0 for NVRs, Branches, or Cameras)
      const hasData = totalNVRs > 0 || totalCameras > 0 || totalBranches > 0;

      // Get charts and summary data from mock for now (will calculate from DB later)
      const mockData = MOCK_DATA.dashboard;
      
      const dashboardData = hasData ? {
        kpis: {
          totalNVRs: { value: totalNVRs, change: '+2', changeLabel: 'this month' },
          totalCameras: { value: totalCameras, percentage: totalNVRs > 0 ? ((onlineCameras / totalCameras) * 100).toFixed(0) : 0, online: onlineCameras },
          offlineNVRs: { value: totalNVRs - onlineNVRs, change: '-1', changeLabel: 'from yesterday' },
          offlineCameras: { value: totalCameras - onlineCameras, change: '-1', changeLabel: 'from yesterday' }
        },
        alerts: {
          critical: recentAlerts.filter(a => a.severity === 'critical').length,
          high: recentAlerts.filter(a => a.severity === 'high').length,
          medium: recentAlerts.filter(a => a.severity === 'medium').length,
          low: recentAlerts.filter(a => a.severity === 'low').length
        },
        storageUsage: 62.5, // TODO: Calculate from actual data
        recentAlerts: recentAlerts.slice(0, 3).map(a => ({
          id: a.id,
          message: a.message,
          severity: a.severity,
          time: a.created_at ? new Date(a.created_at).toLocaleString() : 'just now'
        })),
        // Add mock charts and summary data for now
        charts: mockData.charts,
        summary: {
          regions: Math.ceil(totalBranches / 8), // Estimate
          branches: totalBranches,
          usedStorage: '8.1 TB',
          totalStorage: '12.5 TB',
          systemUptime: 99.8
        },
        regionBreakdown: mockData.regionBreakdown
      } : MOCK_DATA.dashboard;

      res.render('dashboard', {
        title: 'Dashboard',
        currentPage: 'dashboard',
        data: dashboardData
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Fallback to mock data on error
      res.render('dashboard', {
        title: 'Dashboard',
        currentPage: 'dashboard',
        data: MOCK_DATA.dashboard
      });
    }
  }
}

module.exports = new DashboardController();
