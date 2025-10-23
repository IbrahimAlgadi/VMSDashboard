const { 
  generateTimestamps, 
  randomChoice, 
  randomInt, 
  randomDecimal 
} = require('./utils/helpers');

class AnalyticsDataSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // Get entities from database
    const [regionsResult, branchesResult, nvrsResult, camerasResult] = await Promise.all([
      this.db.query('SELECT id, name FROM regions ORDER BY id'),
      this.db.query('SELECT id, name, region_id FROM branches ORDER BY id'),
      this.db.query('SELECT id, device_name, branch_id FROM nvrs ORDER BY id'),
      this.db.query('SELECT id, name, branch_id FROM cameras ORDER BY id')
    ]);

    const regions = regionsResult.rows;
    const branches = branchesResult.rows;
    const nvrs = nvrsResult.rows;
    const cameras = camerasResult.rows;

    if (regions.length === 0) {
      throw new Error('No regions found. Please run regions seeder first.');
    }

    const analyticsData = [];
    
    // Generate analytics data for the past 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // System-level metrics
    await this.generateSystemMetrics(analyticsData, thirtyDaysAgo, now);
    
    // Region-level metrics
    for (const region of regions) {
      await this.generateRegionMetrics(analyticsData, region, branches, thirtyDaysAgo, now);
    }
    
    // Branch-level metrics
    for (const branch of branches) {
      await this.generateBranchMetrics(analyticsData, branch, thirtyDaysAgo, now);
    }
    
    // NVR-level metrics
    for (const nvr of nvrs) {
      await this.generateNvrMetrics(analyticsData, nvr, thirtyDaysAgo, now);
    }
    
    // Camera-level metrics
    for (const camera of cameras) {
      await this.generateCameraMetrics(analyticsData, camera, thirtyDaysAgo, now);
    }

    // Insert in smaller batches to avoid parameter limits
    const batchSize = 1000; // Insert 1000 records at a time
    let totalInserted = 0;
    
    for (let i = 0; i < analyticsData.length; i += batchSize) {
      const batch = analyticsData.slice(i, i + batchSize);
      const batchResult = await this.db.insertBatch('analytics_data', batch, 'DO NOTHING');
      totalInserted += batchResult.length;
    }
    
    const result = { length: totalInserted };
    
    // Generate summary statistics
    const stats = {
      total: analyticsData.length,
      metricTypes: {},
      entities: {}
    };

    analyticsData.forEach(record => {
      stats.metricTypes[record.metric_type] = (stats.metricTypes[record.metric_type] || 0) + 1;
      stats.entities[record.entity_type] = (stats.entities[record.entity_type] || 0) + 1;
    });

    const metricSummary = Object.entries(stats.metricTypes)
      .map(([type, count]) => `${type}(${count})`)
      .join(', ');
    
    return {
      summary: `Created ${result.length} analytics records - Metrics: ${metricSummary}`
    };
  }

  async generateSystemMetrics(analyticsData, startDate, endDate) {
    const metrics = [
      { name: 'total_uptime', type: 'uptime', unit: 'percent' },
      { name: 'system_alerts', type: 'alerts', unit: 'count' },
      { name: 'total_storage', type: 'storage', unit: 'GB' },
      { name: 'network_throughput', type: 'network', unit: 'Mbps' },
      { name: 'response_time', type: 'performance', unit: 'ms' },
      { name: 'compliance_score', type: 'compliance', unit: 'percent' }
    ];

    // Generate daily system metrics
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      for (const metric of metrics) {
        const value = this.generateMetricValue(metric.name, metric.type);
        
        analyticsData.push({
          metric_type: metric.type,
          metric_name: metric.name,
          entity_type: 'system',
          entity_id: null,
          value: value,
          unit: metric.unit,
          timestamp: new Date(d).toISOString(),
          aggregation_period: 'day',
          metadata: JSON.stringify({ source: 'system_monitor' }),
          created_at: new Date().toISOString()
        });
      }
    }
  }

  async generateRegionMetrics(analyticsData, region, branches, startDate, endDate) {
    const regionBranches = branches.filter(b => b.region_id === region.id);
    
    const metrics = [
      { name: 'region_uptime', type: 'uptime', unit: 'percent' },
      { name: 'branch_count', type: 'performance', unit: 'count' },
      { name: 'alert_count', type: 'alerts', unit: 'count' }
    ];

    // Generate weekly region metrics
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
      for (const metric of metrics) {
        let value;
        if (metric.name === 'branch_count') {
          value = regionBranches.length;
        } else {
          value = this.generateMetricValue(metric.name, metric.type);
        }
        
        analyticsData.push({
          metric_type: metric.type,
          metric_name: metric.name,
          entity_type: 'region',
          entity_id: region.id,
          value: value,
          unit: metric.unit,
          timestamp: new Date(d).toISOString(),
          aggregation_period: 'week',
          metadata: JSON.stringify({ region_name: region.name }),
          created_at: new Date().toISOString()
        });
      }
    }
  }

  async generateBranchMetrics(analyticsData, branch, startDate, endDate) {
    const metrics = [
      { name: 'branch_uptime', type: 'uptime', unit: 'percent' },
      { name: 'device_count', type: 'performance', unit: 'count' },
      { name: 'storage_usage', type: 'storage', unit: 'percent' }
    ];

    // Generate daily branch metrics for last 7 days only (to reduce volume)
    const lastWeek = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    for (let d = new Date(lastWeek); d <= endDate; d.setDate(d.getDate() + 1)) {
      for (const metric of metrics) {
        const value = this.generateMetricValue(metric.name, metric.type);
        
        analyticsData.push({
          metric_type: metric.type,
          metric_name: metric.name,
          entity_type: 'branch',
          entity_id: branch.id,
          value: value,
          unit: metric.unit,
          timestamp: new Date(d).toISOString(),
          aggregation_period: 'day',
          metadata: JSON.stringify({ branch_name: branch.name }),
          created_at: new Date().toISOString()
        });
      }
    }
  }

  async generateNvrMetrics(analyticsData, nvr, startDate, endDate) {
    const metrics = [
      { name: 'nvr_uptime', type: 'uptime', unit: 'percent' },
      { name: 'storage_usage', type: 'storage', unit: 'percent' },
      { name: 'cpu_usage', type: 'performance', unit: 'percent' },
      { name: 'memory_usage', type: 'performance', unit: 'percent' }
    ];

    // Generate hourly NVR metrics for last 3 days only (to keep volume manageable)
    const lastThreeDays = new Date(endDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    for (let d = new Date(lastThreeDays); d <= endDate; d.setTime(d.getTime() + 6 * 60 * 60 * 1000)) { // Every 6 hours
      for (const metric of metrics) {
        const value = this.generateMetricValue(metric.name, metric.type);
        
        analyticsData.push({
          metric_type: metric.type,
          metric_name: metric.name,
          entity_type: 'nvr',
          entity_id: nvr.id,
          value: value,
          unit: metric.unit,
          timestamp: new Date(d).toISOString(),
          aggregation_period: 'hour',
          metadata: JSON.stringify({ nvr_name: nvr.device_name }),
          created_at: new Date().toISOString()
        });
      }
    }
  }

  async generateCameraMetrics(analyticsData, camera, startDate, endDate) {
    const metrics = [
      { name: 'camera_uptime', type: 'uptime', unit: 'percent' },
      { name: 'video_quality', type: 'performance', unit: 'score' },
      { name: 'motion_events', type: 'alerts', unit: 'count' }
    ];

    // Generate daily camera metrics for last 7 days only
    const lastWeek = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    for (let d = new Date(lastWeek); d <= endDate; d.setDate(d.getDate() + 1)) {
      for (const metric of metrics) {
        const value = this.generateMetricValue(metric.name, metric.type);
        
        analyticsData.push({
          metric_type: metric.type,
          metric_name: metric.name,
          entity_type: 'camera',
          entity_id: camera.id,
          value: value,
          unit: metric.unit,
          timestamp: new Date(d).toISOString(),
          aggregation_period: 'day',
          metadata: JSON.stringify({ camera_name: camera.name }),
          created_at: new Date().toISOString()
        });
      }
    }
  }

  generateMetricValue(metricName, metricType) {
    switch (metricType) {
      case 'uptime':
        return randomDecimal(95.0, 99.9, 2);
      
      case 'storage':
        if (metricName.includes('usage')) {
          return randomDecimal(30.0, 85.0, 1);
        } else if (metricName.includes('total')) {
          return randomInt(1000, 50000); // GB
        }
        return randomDecimal(50.0, 90.0, 1);
      
      case 'network':
        return randomDecimal(10.0, 100.0, 1);
      
      case 'performance':
        if (metricName.includes('response_time')) {
          return randomDecimal(20.0, 150.0, 1);
        } else if (metricName.includes('cpu') || metricName.includes('memory')) {
          return randomDecimal(20.0, 80.0, 1);
        } else if (metricName.includes('quality')) {
          return randomDecimal(7.0, 10.0, 1); // Quality score out of 10
        } else if (metricName.includes('count')) {
          return randomInt(1, 50);
        }
        return randomDecimal(70.0, 95.0, 1);
      
      case 'alerts':
        return randomInt(0, 25);
      
      case 'compliance':
        return randomDecimal(75.0, 95.0, 1);
      
      default:
        return randomDecimal(0.0, 100.0, 2);
    }
  }
}

module.exports = AnalyticsDataSeeder;
