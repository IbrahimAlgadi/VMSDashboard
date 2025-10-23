const { 
  generateTimestamps, 
  randomChoice, 
  randomInt,
  randomDate 
} = require('./utils/helpers');

class ReportsSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // Get users from database
    const usersResult = await this.db.query('SELECT id, username, role FROM users WHERE is_active = true ORDER BY id');
    const users = usersResult.rows;

    if (users.length === 0) {
      throw new Error('No users found. Please run users seeder first.');
    }

    const reports = [];
    
    // Generate reports for the past 90 days
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Report configurations
    const reportConfigs = [
      {
        type: 'uptime',
        formats: ['pdf', 'excel'],
        users: users.filter(u => ['admin', 'operator'].includes(u.role)),
        count: randomInt(8, 15)
      },
      {
        type: 'compliance',
        formats: ['pdf', 'excel', 'csv'],
        users: users.filter(u => ['admin', 'operator', 'viewer'].includes(u.role)),
        count: randomInt(12, 20)
      },
      {
        type: 'security',
        formats: ['pdf'],
        users: users.filter(u => ['admin'].includes(u.role)),
        count: randomInt(6, 12)
      },
      {
        type: 'analytics',
        formats: ['excel', 'csv'],
        users: users.filter(u => ['admin', 'operator'].includes(u.role)),
        count: randomInt(10, 18)
      },
      {
        type: 'maintenance',
        formats: ['pdf', 'excel'],
        users: users.filter(u => ['admin', 'technician'].includes(u.role)),
        count: randomInt(5, 10)
      },
      {
        type: 'custom',
        formats: ['pdf', 'excel', 'csv'],
        users: users,
        count: randomInt(8, 15)
      }
    ];

    for (const config of reportConfigs) {
      for (let i = 0; i < config.count; i++) {
        const user = randomChoice(config.users);
        const format = randomChoice(config.formats);
        const reportName = this.generateReportName(config.type, format);
        
        // Generate date range (reports typically cover 1-30 day periods)
        const rangeDays = randomChoice([1, 7, 15, 30]);
        const endDate = randomDate(ninetyDaysAgo, now);
        const startDate = new Date(endDate.getTime() - rangeDays * 24 * 60 * 60 * 1000);
        
        // Determine report status and timing
        const requestedAt = randomDate(startDate, now);
        let status, generatedAt, filePath, fileSize, expiresAt;
        
        const statusRand = Math.random();
        if (statusRand < 0.05) {
          status = 'pending';
        } else if (statusRand < 0.08) {
          status = 'generating';
        } else if (statusRand < 0.1) {
          status = 'failed';
        } else {
          status = 'completed';
          generatedAt = new Date(requestedAt.getTime() + randomInt(2, 30) * 60 * 1000); // 2-30 minutes later
          filePath = `/reports/${config.type}/${reportName.replace(/ /g, '_')}_${Date.now()}.${format}`;
          fileSize = this.generateFileSize(format, config.type);
          expiresAt = new Date(generatedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days expiry
        }

        const parameters = this.generateReportParameters(config.type);
        const downloadCount = status === 'completed' ? randomInt(0, 8) : 0;

        const report = {
          generated_by: user.id,
          name: reportName,
          type: config.type,
          format: format,
          parameters: JSON.stringify(parameters),
          date_range_start: startDate.toISOString().split('T')[0],
          date_range_end: endDate.toISOString().split('T')[0],
          status: status,
          file_path: filePath,
          file_size: fileSize,
          generated_at: generatedAt ? generatedAt.toISOString() : null,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          download_count: downloadCount,
          created_at: requestedAt.toISOString(),
          updated_at: (generatedAt || requestedAt).toISOString()
        };

        reports.push(report);
      }
    }

    // Sort reports by creation time (newest first)
    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const result = await this.db.insertBatch('reports', reports, 'DO NOTHING');
    
    // Generate summary statistics
    const stats = {
      total: reports.length,
      completed: reports.filter(r => r.status === 'completed').length,
      pending: reports.filter(r => r.status === 'pending').length,
      failed: reports.filter(r => r.status === 'failed').length,
      types: {},
      formats: {}
    };

    reports.forEach(report => {
      stats.types[report.type] = (stats.types[report.type] || 0) + 1;
      stats.formats[report.format] = (stats.formats[report.format] || 0) + 1;
    });

    const typeSummary = Object.entries(stats.types)
      .slice(0, 3)
      .map(([type, count]) => `${type}(${count})`)
      .join(', ');

    const formatSummary = Object.entries(stats.formats)
      .map(([format, count]) => `${format}(${count})`)
      .join(', ');
    
    return {
      summary: `Created ${result.length} reports - Status: completed(${stats.completed}), pending(${stats.pending}), failed(${stats.failed}) - Types: ${typeSummary} - Formats: ${formatSummary}`
    };
  }

  generateReportName(type, format) {
    const names = {
      uptime: [
        'System Uptime Analysis',
        'Device Availability Report',
        'Uptime Performance Summary',
        'Availability Metrics Report'
      ],
      compliance: [
        'Compliance Assessment Report',
        'Regulatory Compliance Summary',
        'Compliance Status Overview',
        'Standards Adherence Report'
      ],
      security: [
        'Security Incident Report',
        'Security Assessment Summary',
        'Threat Analysis Report',
        'Security Compliance Audit'
      ],
      analytics: [
        'Performance Analytics Report',
        'System Metrics Analysis',
        'Operational Statistics Report',
        'Performance Trends Summary'
      ],
      maintenance: [
        'Maintenance Schedule Report',
        'Preventive Maintenance Log',
        'Equipment Maintenance Summary',
        'Service History Report'
      ],
      custom: [
        'Custom Analysis Report',
        'Ad-hoc Performance Review',
        'Special Investigation Report',
        'Custom Metrics Analysis'
      ]
    };

    const reportNames = names[type] || names.custom;
    return randomChoice(reportNames);
  }

  generateReportParameters(type) {
    const baseParams = {
      includeCharts: randomChoice([true, false]),
      includeRawData: randomChoice([true, false]),
      groupBy: randomChoice(['branch', 'region', 'device_type'])
    };

    const typeSpecificParams = {
      uptime: {
        ...baseParams,
        uptimeThreshold: randomChoice([95, 98, 99]),
        includeDowntime: true,
        showTrends: true
      },
      compliance: {
        ...baseParams,
        complianceCategories: randomChoice([['camera'], ['nvr'], ['camera', 'nvr']]),
        showFailedOnly: randomChoice([true, false]),
        includeRecommendations: true
      },
      security: {
        ...baseParams,
        severityFilter: randomChoice([['critical'], ['critical', 'high'], null]),
        includeResolved: randomChoice([true, false]),
        showTimeline: true
      },
      analytics: {
        ...baseParams,
        metrics: randomChoice([['uptime'], ['storage'], ['uptime', 'storage', 'alerts']]),
        aggregation: randomChoice(['hourly', 'daily', 'weekly']),
        includePredictions: randomChoice([true, false])
      },
      maintenance: {
        ...baseParams,
        includeScheduled: true,
        includeCompleted: true,
        showCosts: randomChoice([true, false])
      },
      custom: {
        ...baseParams,
        customFilters: {
          region: randomChoice([null, 'Riyadh', 'Jeddah']),
          deviceType: randomChoice([null, 'camera', 'nvr'])
        }
      }
    };

    return typeSpecificParams[type] || baseParams;
  }

  generateFileSize(format, type) {
    // Generate realistic file sizes based on format and type
    let baseSize;
    
    switch (format) {
      case 'pdf':
        baseSize = randomInt(500, 3000); // 0.5-3 MB
        break;
      case 'excel':
        baseSize = randomInt(200, 1500); // 0.2-1.5 MB
        break;
      case 'csv':
        baseSize = randomInt(50, 500); // 50KB-500KB
        break;
      case 'json':
        baseSize = randomInt(100, 800); // 100KB-800KB
        break;
      default:
        baseSize = randomInt(200, 1000);
    }

    // Adjust size based on report type complexity
    const multipliers = {
      analytics: 1.5,
      compliance: 1.3,
      security: 1.2,
      uptime: 1.1,
      maintenance: 1.0,
      custom: 1.2
    };

    const multiplier = multipliers[type] || 1.0;
    return Math.floor(baseSize * multiplier * 1024); // Convert to bytes
  }
}

module.exports = ReportsSeeder;
