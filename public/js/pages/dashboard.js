// Dashboard Page JavaScript

let dashboardData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  initRefresh();
});

// Load dashboard data
async function loadDashboard() {
  try {
    // Get data from server-rendered template
    if (window.dashboardDataFromServer) {
      dashboardData = window.dashboardDataFromServer;
    } else {
      // Fallback to mock data
      const dashResponse = await fetch('/data/mock/dashboard-data.json');
      dashboardData = await dashResponse.json();
    }
    
    // Load alerts data
    const alertsResponse = await fetch('/data/mock/alerts-data.json');
    const alertsData = await alertsResponse.json();
    
    renderKPIs();
    renderCharts();
    renderRecentAlerts(alertsData.recentAlerts || []);
    renderSystemSummary();
    renderRegionalDistribution();
    
    // Update last update time
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
    
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

// Render KPI cards
function renderKPIs() {
  const { kpis } = dashboardData;
  
  // Check if data structure is object or number and convert
  const totalNVRsValue = typeof kpis.totalNVRs === 'object' ? kpis.totalNVRs.value : kpis.totalNVRs;
  const totalCamerasValue = typeof kpis.totalCameras === 'object' ? kpis.totalCameras.value : kpis.totalCameras;
  const offlineNVRsValue = typeof kpis.offlineNVRs === 'object' ? kpis.offlineNVRs.value : kpis.offlineNVRs;
  const offlineCamerasValue = typeof kpis.offlineCameras === 'object' ? kpis.offlineCameras.value : kpis.offlineCameras;
  
  // Total NVRs
  document.getElementById('totalNVRs').textContent = totalNVRsValue || 0;
  document.getElementById('totalNVRsChange').innerHTML = `
    <span class="text-success">+2</span> this month
  `;
  
  // Total Cameras
  document.getElementById('totalCameras').textContent = totalCamerasValue || 0;
  document.getElementById('totalCamerasChange').innerHTML = `
    <span class="text-success">100% online</span> ${totalCamerasValue || 0} of ${totalCamerasValue || 0}
  `;
  
  // Offline NVRs
  document.getElementById('offlineNVRs').textContent = offlineNVRsValue || 0;
  document.getElementById('offlineNVRsChange').innerHTML = `
    <span class="text-success">-1</span> from yesterday
  `;
  
  // Offline Cameras
  document.getElementById('offlineCameras').textContent = offlineCamerasValue || 0;
  document.getElementById('offlineCamerasChange').innerHTML = `
    <span class="text-success">-1</span> from yesterday
  `;
}

// Render all charts
function renderCharts() {
  renderSystemHealthChart();
  renderCameraStatusTrendChart();
  renderNVRStatusTrendChart();
  renderStorageTrendChart();
}

// System Health Gauge Chart
function renderSystemHealthChart() {
  const chart = echarts.init(document.getElementById('systemHealthChart'));
  // Handle both object format (systemHealth.current) and array format (take last value)
  const health = dashboardData.charts.systemHealth?.current || 
                 (Array.isArray(dashboardData.charts.systemHealth) ? 
                  dashboardData.charts.systemHealth[dashboardData.charts.systemHealth.length - 1] : 98);
  
  chart.setOption({
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      center: ['50%', '75%'],
      radius: '90%',
      itemStyle: {
        color: health >= 90 ? '#198754' : health >= 70 ? '#ffc107' : '#dc3545'
      },
      progress: {
        show: true,
        width: 18
      },
      pointer: {
        show: false
      },
      axisLine: {
        lineStyle: {
          width: 18,
          color: [[1, '#e9ecef']]
        }
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        fontSize: 24,
        fontWeight: 'bold',
        offsetCenter: [0, '-10%'],
        color: 'auto'
      },
      data: [{
        value: health,
        name: 'System Health'
      }],
      title: {
        show: true,
        offsetCenter: [0, '30%'],
        fontSize: 14
      }
    }]
  });
  
  window.addEventListener('resize', () => chart.resize());
}

// Camera Status Trend Chart
function renderCameraStatusTrendChart() {
  const chart = echarts.init(document.getElementById('cameraStatusChart'));
  let data = dashboardData.charts.cameraStatus || dashboardData.charts.cameraStatusTrend || [];
  
  // Handle array format (just values) vs object format (objects with date, online, offline)
  if (Array.isArray(data) && typeof data[0] === 'number') {
    // Convert array to simple line chart
    const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, data.length);
    data = {
      dates,
      online: data
    };
  }
  
  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Cameras']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates || (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' ? data.map(d => d.date) : []),
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [
              {
          name: 'Cameras',
          type: 'line',
          data: data.online || (Array.isArray(data) && typeof data[0] === 'number' ? data : []),
          smooth: true,
        areaStyle: { color: 'rgba(25, 135, 84, 0.1)' },
                  lineStyle: { color: '#198754', width: 2 },
          itemStyle: { color: '#198754' }
        }
      ]
    });
    
    window.addEventListener('resize', () => chart.resize());
  }
  
  // NVR Status Trend Chart
  function renderNVRStatusTrendChart() {
    const chart = echarts.init(document.getElementById('nvrStatusChart'));
    let data = dashboardData.charts.nvrStatus || dashboardData.charts.nvrStatusTrend || [];
    
    // Handle array format
    if (Array.isArray(data) && typeof data[0] === 'number') {
      const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, data.length);
      data = {
        dates,
        online: data
      };
    }
  
  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['NVRs']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates || (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' ? data.map(d => d.date) : []),
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'NVRs',
        type: 'line',
        data: data.online || (Array.isArray(data) && typeof data[0] === 'number' ? data : []),
        smooth: true,
        areaStyle: { color: 'rgba(13, 110, 253, 0.1)' },
        lineStyle: { color: '#0d6efd', width: 2 },
        itemStyle: { color: '#0d6efd' }
      }
    ]
  });
  
  window.addEventListener('resize', () => chart.resize());
}

// Storage Trend Chart
function renderStorageTrendChart() {
  const chart = echarts.init(document.getElementById('storageTrendChart'));
  let data = dashboardData.charts.storageTrend || [];
  
  // Handle array format
  if (Array.isArray(data) && typeof data[0] === 'number') {
    const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, data.length);
    data = {
      dates,
      usage: data
    };
  }
  
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates || (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' ? data.map(d => d.date) : []),
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      data: data.usage || (Array.isArray(data) && typeof data[0] === 'number' ? data : []),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(255, 193, 7, 0.1)'
      },
      lineStyle: {
        color: '#ffc107',
        width: 2
      },
      itemStyle: {
        color: '#ffc107'
      }
    }]
  });
  
  window.addEventListener('resize', () => chart.resize());
}

// Render recent alerts
function renderRecentAlerts(alertsData) {
  const container = document.getElementById('recentAlerts');
  const recentAlerts = alertsData.slice(0, 5);
  
  container.innerHTML = recentAlerts.map(alert => `
    <div class="alert-item">
      <div class="alert-icon ${alert.severity}">
        <i class="bi ${getSeverityIcon(alert.severity)}"></i>
      </div>
      <div class="alert-content">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-meta">
          <span><i class="bi bi-clock"></i> ${formatTime(alert.timestamp)}</span>
          <span><i class="bi bi-geo-alt"></i> ${alert.location}</span>
        </div>
      </div>
      <span class="badge bg-${getSeverityColor(alert.severity)}">${alert.severity}</span>
    </div>
  `).join('');
}

// Render system summary
function renderSystemSummary() {
  const { summary } = dashboardData;
  
  document.getElementById('summaryRegions').textContent = summary.regions;
  document.getElementById('summaryBranches').textContent = summary.branches;
  document.getElementById('summaryStorage').textContent = `${summary.usedStorage} / ${summary.totalStorage}`;
  document.getElementById('summaryUptime').textContent = `${summary.systemUptime}%`;
}

// Render regional distribution
function renderRegionalDistribution() {
  const container = document.getElementById('regionalBreakdown');
  
  container.innerHTML = dashboardData.regionBreakdown.map(region => `
    <tr>
      <td><strong>${region.region || region.name || 'Unknown'}</strong></td>
      <td>${region.nvrs}</td>
      <td>${region.cameras}</td>
      <td><span class="text-success">${region.online}</span></td>
      <td><span class="text-danger">${region.offline}</span></td>
      <td>
        <div class="progress" style="height: 6px;">
          <div class="progress-bar bg-success" style="width: ${(region.online/region.cameras*100).toFixed(0)}%"></div>
        </div>
      </td>
    </tr>
  `).join('');
}

// Helper functions
function getSeverityIcon(severity) {
  const icons = {
    'critical': 'bi-exclamation-octagon-fill',
    'high': 'bi-exclamation-triangle-fill',
    'medium': 'bi-info-circle-fill',
    'low': 'bi-check-circle-fill'
  };
  return icons[severity] || 'bi-info-circle';
}

function getSeverityColor(severity) {
  const colors = {
    'critical': 'danger',
    'high': 'warning',
    'medium': 'info',
    'low': 'secondary'
  };
  return colors[severity] || 'secondary';
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

// Initialize refresh button
function initRefresh() {
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    location.reload();
  });
}
