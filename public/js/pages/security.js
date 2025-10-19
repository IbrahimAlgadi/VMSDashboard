// Security Monitoring Page JavaScript
let securityData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadSecurityData();
  initButtons();
});

async function loadSecurityData() {
  try {
    const response = await fetch('/data/mock/security-data.json');
    securityData = await response.json();
    renderMetrics();
    renderCharts();
    renderEvents();
    renderFailedAccess();
  } catch (error) {
    console.error('Failed to load security data:', error);
  }
}

function renderMetrics() {
  const { overview, securityMetrics } = securityData;
  document.getElementById('failedLogins').textContent = overview.failedAccessAttempts;
  document.getElementById('activeIncidents').textContent = overview.activeIncidents;
  document.getElementById('resolvedToday').textContent = overview.resolvedToday;
  document.getElementById('systemHealth').textContent = overview.systemHealth + '%';
  document.getElementById('threatLevelText').textContent = overview.threatLevel;
  
  const threatAlert = document.getElementById('threatAlert');
  threatAlert.className = `alert alert-${overview.threatLevel === 'Low' ? 'success' : overview.threatLevel === 'Medium' ? 'warning' : 'danger'} alert-dismissible fade show`;
}

function renderCharts() {
  // Threat Gauge
  renderThreatGauge();
  
  // Threat History
  renderThreatHistory();
}

function renderThreatGauge() {
  const chart = echarts.init(document.getElementById('threatGauge'));
  
  const threatValue = securityData.overview.threatLevel === 'Low' ? 25 : 
                      securityData.overview.threatLevel === 'Medium' ? 50 : 75;
  
  chart.setOption({
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 4,
      center: ['50%', '75%'],
      radius: '90%',
      itemStyle: {
        color: threatValue < 40 ? '#198754' : threatValue < 70 ? '#ffc107' : '#dc3545'
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
      axisTick: {
        show: false
      },
      splitLine: {
        show: false
      },
      axisLabel: {
        show: false
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        fontSize: 24,
        fontWeight: 'bold',
        offsetCenter: [0, '-10%'],
        color: 'auto'
      },
      data: [{
        value: threatValue,
        name: securityData.overview.threatLevel + ' Threat'
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

function renderThreatHistory() {
  const chart = echarts.init(document.getElementById('threatChart'));
  
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
      data: securityData.threatLevelHistory.map(d => d.time),
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
      name: 'Threat Level',
      data: securityData.threatLevelHistory.map(d => d.level),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(220, 53, 69, 0.1)'
      },
      lineStyle: {
        color: '#dc3545',
        width: 2
      },
      itemStyle: {
        color: '#dc3545'
      }
    }]
  });
  
  window.addEventListener('resize', () => chart.resize());
}

function renderEvents() {
  const timeline = document.getElementById('eventsTimeline');
  timeline.innerHTML = securityData.recentEvents.map(event => `
    <div class="timeline-item">
      <div class="timeline-dot ${event.severity}"></div>
      <div class="event-header">
        <h6 class="event-title">${event.type}</h6>
        <span class="badge bg-${event.severity === 'critical' ? 'danger' : event.severity === 'high' ? 'warning' : event.severity === 'medium' ? 'info' : 'success'}">${event.severity}</span>
      </div>
      <div class="event-meta">
        <i class="bi bi-clock"></i> ${new Date(event.timestamp).toLocaleString()} | 
        <i class="bi bi-geo-alt"></i> ${event.location}
      </div>
      <div class="event-description">${event.description}</div>
      <div><span class="badge bg-secondary">${event.status}</span></div>
    </div>
  `).join('');
}

function renderFailedAccess() {
  const table = document.getElementById('failedAccessTable');
  table.innerHTML = securityData.failedAccess.map(access => `
    <tr>
      <td>${new Date(access.timestamp).toLocaleString()}</td>
      <td><code>${access.username}</code></td>
      <td><code>${access.ipAddress}</code></td>
      <td>${access.location}</td>
      <td><span class="badge bg-danger">${access.attempts}</span></td>
      <td>${access.reason}</td>
    </tr>
  `).join('');
}

function initButtons() {
  document.getElementById('refreshBtn').addEventListener('click', () => location.reload());
  document.getElementById('exportBtn').addEventListener('click', () => alert('Exporting security report...'));
}

