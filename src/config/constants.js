// Mock data constants for testing without database
const MOCK_DATA = {
  dashboard: {
    kpis: {
      totalNVRs: 127,
      totalCameras: 1420,
      totalBranches: 45,
      onlineNVRs: 118,
      onlineCameras: 1398,
      overallUptime: 99.2
    },
    alerts: {
      critical: 3,
      high: 12,
      medium: 45,
      low: 128
    },
    storageUsage: 62.5,
    recentAlerts: [
      { id: 1, message: 'Camera NVR-001-01-05 offline', severity: 'critical', time: '2m ago' },
      { id: 2, message: 'Storage at 85% on NVR-001', severity: 'high', time: '15m ago' },
      { id: 3, message: 'Network latency detected', severity: 'medium', time: '1h ago' }
    ],
    charts: {
      systemHealth: [98, 99, 98, 99, 98, 99, 98],
      cameraStatus: [1420, 1415, 1418, 1420, 1419, 1420, 1420],
      nvrStatus: [118, 120, 118, 119, 118, 120, 118],
      storageTrend: [62, 63, 64, 63, 62, 61, 62]
    },
    summary: {
      regions: 8,
      branches: 45,
      usedStorage: '8.1 TB',
      totalStorage: '12.5 TB',
      systemUptime: 99.8
    },
    regionBreakdown: [
      { region: 'Riyadh', nvrs: 35, cameras: 420, online: 398, offline: 22, status: 'good' },
      { region: 'Jeddah', nvrs: 28, cameras: 336, online: 330, offline: 6, status: 'excellent' },
      { region: 'Dammam', nvrs: 25, cameras: 300, online: 298, offline: 2, status: 'excellent' },
      { region: 'Khobar', nvrs: 22, cameras: 264, online: 250, offline: 14, status: 'warning' },
      { region: 'Mecca', nvrs: 17, cameras: 204, online: 200, offline: 4, status: 'good' }
    ]
  },

  nvrs: [
    {
      id: 1,
      name: 'NVR-RD-001-01',
      branch: 'Riyadh - King Fahd Branch',
      ip_address: '192.168.1.10',
      status: 'online',
      cameras: 16,
      storage: 68,
      uptime: 99.8,
      last_seen: '2 minutes ago'
    },
    {
      id: 2,
      name: 'NVR-JD-001-01',
      branch: 'Jeddah - Al Hamra Branch',
      ip_address: '192.168.2.15',
      status: 'offline',
      cameras: 12,
      storage: 45,
      uptime: 98.5,
      last_seen: '5 minutes ago'
    },
    {
      id: 3,
      name: 'NVR-RD-001-02',
      branch: 'Riyadh - Olaya Branch',
      ip_address: '192.168.1.25',
      status: 'warning',
      cameras: 8,
      storage: 92,
      uptime: 99.2,
      last_seen: '1 minute ago'
    },
    {
      id: 4,
      name: 'NVR-DM-001-01',
      branch: 'Dammam - Corniche Branch',
      ip_address: '192.168.3.10',
      status: 'online',
      cameras: 14,
      storage: 55,
      uptime: 99.9,
      last_seen: '30 seconds ago'
    }
  ],

  cameras: [
    {
      id: 1,
      name: 'CAM-RD-001-01-01',
      nvr: 'NVR-RD-001-01',
      position: 'ATM Entrance',
      status: 'online',
      resolution: '4MP',
      recording: true,
      motion: true
    },
    {
      id: 2,
      name: 'CAM-RD-001-01-02',
      nvr: 'NVR-RD-001-01',
      position: 'ATM Interior',
      status: 'online',
      resolution: '4MP',
      recording: true,
      motion: true
    },
    {
      id: 3,
      name: 'CAM-RD-001-01-03',
      nvr: 'NVR-RD-001-01',
      position: 'Cash Dispenser',
      status: 'offline',
      resolution: '5MP',
      recording: false,
      motion: false
    }
  ],

  alerts: [
    {
      id: 1,
      title: 'Camera Offline',
      message: 'Camera CAM-RD-001-01-03 has gone offline',
      type: 'camera_offline',
      severity: 'critical',
      source: 'camera',
      sourceId: 3,
      branch: 'Riyadh - King Fahd',
      status: 'active',
      time: '2 minutes ago'
    },
    {
      id: 2,
      title: 'Storage Warning',
      message: 'Storage usage at 92% on NVR-RD-001-02',
      type: 'storage_warning',
      severity: 'high',
      source: 'nvr',
      sourceId: 3,
      branch: 'Riyadh - Olaya',
      status: 'active',
      time: '15 minutes ago'
    },
    {
      id: 3,
      title: 'Network Issue',
      message: 'High packet loss on network segment',
      type: 'network_issue',
      severity: 'medium',
      source: 'system',
      sourceId: null,
      branch: 'Riyadh - King Fahd',
      status: 'acknowledged',
      time: '1 hour ago'
    }
  ],

  compliance: {
    overall: 87.5,
    requirements: [
      { id: 1, name: 'Camera Resolution >= 4MP', status: 'passed', compliance: '96%' },
      { id: 2, name: 'Recording Enabled', status: 'passed', compliance: '98%' },
      { id: 3, name: 'Motion Detection', status: 'passed', compliance: '95%' },
      { id: 4, name: 'Storage >= 30 days', status: 'failed', compliance: '78%' },
      { id: 5, name: 'Encryption Enabled', status: 'warning', compliance: '82%' }
    ],
    failed: 3,
    passed: 15,
    warning: 2
  },

  security: {
    events: [
      { id: 1, type: 'Unauthorized Access', severity: 'high', device: 'NVR-RD-001-01', time: '5 min ago', status: 'investigating' },
      { id: 2, type: 'Weak Password', severity: 'medium', device: 'CAM-RD-001-01-01', time: '2h ago', status: 'resolved' },
      { id: 3, type: 'HTTP Access Detected', severity: 'critical', device: 'NVR-RD-001-02', time: '1h ago', status: 'active' }
    ]
  },

  analytics: {
    charts: {
      uptime: [99.5, 99.2, 99.8, 99.1, 99.6, 99.4, 99.7],
      storage: [65, 68, 72, 70, 68, 65, 62],
      alerts: [12, 15, 8, 10, 7, 9, 5]
    }
  },

  reports: [
    { id: 1, name: 'Monthly Uptime Report', type: 'uptime', status: 'completed', date: '2024-01-15' },
    { id: 2, name: 'Compliance Audit Report', type: 'compliance', status: 'completed', date: '2024-01-10' },
    { id: 3, name: 'Security Assessment', type: 'security', status: 'generating', date: '2024-01-20' }
  ]
};

module.exports = MOCK_DATA;
