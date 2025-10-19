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
  const gaugeChart = Charts.createGaugeChart('threatGauge', 25, 'Threat Level');
  
  // Threat History
  const lineChart = echarts.init(document.getElementById('threatChart'));
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: securityData.threatLevelHistory.map(d => d.time) },
    yAxis: { type: 'value', max: 100 },
    series: [{ data: securityData.threatLevelHistory.map(d => d.level), type: 'line', smooth: true, areaStyle: { opacity: 0.3 } }]
  });
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

