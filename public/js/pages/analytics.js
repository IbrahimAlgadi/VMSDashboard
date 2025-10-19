// Analytics Page JavaScript

let analyticsData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadAnalyticsData();
  initDatePicker();
});

// Load analytics data
async function loadAnalyticsData() {
  try {
    const response = await fetch('/data/mock/analytics-data.json');
    analyticsData = await response.json();
    
    renderCharts();
    renderRegionalTable();
    
  } catch (error) {
    console.error('Failed to load analytics data:', error);
  }
}

// Render all charts
function renderCharts() {
  renderUptimeChart();
  renderAlertsChart();
  renderActivityChart();
}

// Render uptime trend chart
function renderUptimeChart() {
  const chart = echarts.init(document.getElementById('uptimeChart'));
  
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
      data: analyticsData.cameraUptime.map(d => d.date),
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: 98,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: 'Uptime',
      data: analyticsData.cameraUptime.map(d => d.uptime),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(13, 110, 253, 0.1)'
      },
      lineStyle: {
        color: '#0d6efd',
        width: 2
      },
      itemStyle: {
        color: '#0d6efd'
      }
    }]
  });
  
  // Make responsive
  window.addEventListener('resize', () => chart.resize());
}

// Render alerts by type pie chart
function renderAlertsChart() {
  const chart = echarts.init(document.getElementById('alertsChart'));
  
  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: 'Alerts',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: analyticsData.alertsByType.map(d => ({
        name: d.type,
        value: d.count
      }))
    }]
  });
  
  // Make responsive
  window.addEventListener('resize', () => chart.resize());
}

// Render hourly activity bar chart
function renderActivityChart() {
  const chart = echarts.init(document.getElementById('activityChart'));
  
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: 'Hour {b}:00<br/>Events: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: analyticsData.hourlyTraffic.map(d => d.hour + ':00')
    },
    yAxis: {
      type: 'value',
      name: 'Events'
    },
    series: [{
      name: 'Activity',
      data: analyticsData.hourlyTraffic.map(d => d.events),
      type: 'bar',
      itemStyle: {
        color: '#0d6efd',
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: '#0a58ca'
        }
      }
    }]
  });
  
  // Make responsive
  window.addEventListener('resize', () => chart.resize());
}

// Render regional overview table
function renderRegionalTable() {
  const table = document.getElementById('regionalTable');
  
  table.innerHTML = analyticsData.regionalActivity.map(region => `
    <div class="region-item mb-2 p-2 border rounded">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <strong>${region.region}</strong>
        <span class="badge bg-primary">${region.cameras}</span>
      </div>
      <small class="text-muted d-block">
        <i class="bi bi-camera"></i> Cameras: ${region.cameras} |
        <i class="bi bi-exclamation-triangle"></i> Alerts: ${region.alerts}
      </small>
      <div class="progress mt-1" style="height: 6px;">
        <div class="progress-bar bg-success" role="progressbar" 
             style="width: ${region.uptime}%" 
             aria-valuenow="${region.uptime}" 
             aria-valuemin="0" 
             aria-valuemax="100">
        </div>
      </div>
      <small class="text-muted">Uptime: ${region.uptime}%</small>
    </div>
  `).join('');
}

// Initialize date picker
function initDatePicker() {
  document.getElementById('applyDate').addEventListener('click', () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    console.log('Date range:', startDate, 'to', endDate);
    // In a real app, this would fetch new data based on the date range
    alert(`Applying date range: ${startDate} to ${endDate}\n\nIn a real application, this would fetch filtered data.`);
  });
}

