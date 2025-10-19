// Analytics Page JavaScript
document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('/data/mock/analytics-data.json');
  const data = await response.json();
  
  // Uptime Chart
  const uptimeChart = echarts.init(document.getElementById('uptimeChart'));
  uptimeChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.cameraUptime.map(d => d.date) },
    yAxis: { type: 'value', min: 98, max: 100 },
    series: [{ data: data.cameraUptime.map(d => d.uptime), type: 'line', smooth: true, areaStyle: {} }]
  });
  
  // Alerts Chart
  const alertsChart = echarts.init(document.getElementById('alertsChart'));
  alertsChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: '60%', data: data.alertsByType.map(d => ({ name: d.type, value: d.count })) }]
  });
  
  // Activity Chart
  const activityChart = echarts.init(document.getElementById('activityChart'));
  activityChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.hourlyTraffic.map(d => d.hour) },
    yAxis: { type: 'value' },
    series: [{ data: data.hourlyTraffic.map(d => d.events), type: 'bar' }]
  });
  
  // Regional Table
  document.getElementById('regionalTable').innerHTML = data.regionalActivity.map(r => `
    <div class="mb-2 p-2 border rounded"><strong>${r.region}</strong><br>
    <small>Cameras: ${r.cameras} | Alerts: ${r.alerts} | Uptime: ${r.uptime}%</small></div>
  `).join('');
});

