const { generateTimestamps } = require('./utils/helpers');

class SystemSettingsSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    const settings = [
      // System Configuration
      {
        category: 'system',
        key: 'app_name',
        value: 'VMS Dashboard',
        data_type: 'string',
        description: 'Application display name',
        ...generateTimestamps(90)
      },
      {
        category: 'system',
        key: 'app_version',
        value: '1.0.0',
        data_type: 'string',
        description: 'Current application version',
        ...generateTimestamps(90)
      },
      {
        category: 'system',
        key: 'timezone',
        value: 'Asia/Riyadh',
        data_type: 'string',
        description: 'Default system timezone',
        ...generateTimestamps(90)
      },
      {
        category: 'system',
        key: 'language',
        value: 'en',
        data_type: 'string',
        description: 'Default system language',
        ...generateTimestamps(90)
      },
      {
        category: 'system',
        key: 'session_timeout',
        value: '3600',
        data_type: 'integer',
        description: 'User session timeout in seconds',
        ...generateTimestamps(60)
      },

      // Monitoring Configuration
      {
        category: 'monitoring',
        key: 'alert_retention_days',
        value: '90',
        data_type: 'integer',
        description: 'Number of days to retain alert records',
        ...generateTimestamps(75)
      },
      {
        category: 'monitoring',
        key: 'uptime_check_interval',
        value: '300',
        data_type: 'integer',
        description: 'Device uptime check interval in seconds',
        ...generateTimestamps(75)
      },
      {
        category: 'monitoring',
        key: 'critical_alert_threshold',
        value: '95.0',
        data_type: 'float',
        description: 'Minimum uptime percentage before critical alert',
        ...generateTimestamps(75)
      },
      {
        category: 'monitoring',
        key: 'storage_warning_threshold',
        value: '80',
        data_type: 'integer',
        description: 'Storage usage percentage for warning alerts',
        ...generateTimestamps(75)
      },
      {
        category: 'monitoring',
        key: 'storage_critical_threshold',
        value: '90',
        data_type: 'integer',
        description: 'Storage usage percentage for critical alerts',
        ...generateTimestamps(75)
      },

      // Security Configuration
      {
        category: 'security',
        key: 'password_min_length',
        value: '8',
        data_type: 'integer',
        description: 'Minimum password length requirement',
        ...generateTimestamps(100)
      },
      {
        category: 'security',
        key: 'password_require_special',
        value: 'true',
        data_type: 'boolean',
        description: 'Require special characters in passwords',
        ...generateTimestamps(100)
      },
      {
        category: 'security',
        key: 'login_attempt_limit',
        value: '5',
        data_type: 'integer',
        description: 'Maximum failed login attempts before lockout',
        ...generateTimestamps(100)
      },
      {
        category: 'security',
        key: 'lockout_duration',
        value: '1800',
        data_type: 'integer',
        description: 'Account lockout duration in seconds',
        ...generateTimestamps(100)
      },
      {
        category: 'security',
        key: 'audit_log_retention',
        value: '365',
        data_type: 'integer',
        description: 'Audit log retention period in days',
        ...generateTimestamps(100)
      },

      // Email Configuration
      {
        category: 'email',
        key: 'smtp_enabled',
        value: 'true',
        data_type: 'boolean',
        description: 'Enable email notifications',
        ...generateTimestamps(80)
      },
      {
        category: 'email',
        key: 'smtp_host',
        value: 'smtp.bank-system.sa',
        data_type: 'string',
        description: 'SMTP server hostname',
        ...generateTimestamps(80)
      },
      {
        category: 'email',
        key: 'smtp_port',
        value: '587',
        data_type: 'integer',
        description: 'SMTP server port',
        ...generateTimestamps(80)
      },
      {
        category: 'email',
        key: 'from_email',
        value: 'vms-alerts@bank-system.sa',
        data_type: 'string',
        description: 'Default sender email address',
        ...generateTimestamps(80)
      },
      {
        category: 'email',
        key: 'alert_email_enabled',
        value: 'true',
        data_type: 'boolean',
        description: 'Send email notifications for alerts',
        ...generateTimestamps(60)
      },

      // Dashboard Configuration
      {
        category: 'dashboard',
        key: 'refresh_interval',
        value: '30000',
        data_type: 'integer',
        description: 'Dashboard auto-refresh interval in milliseconds',
        ...generateTimestamps(45)
      },
      {
        category: 'dashboard',
        key: 'default_view',
        value: 'overview',
        data_type: 'string',
        description: 'Default dashboard view for new users',
        ...generateTimestamps(45)
      },
      {
        category: 'dashboard',
        key: 'show_offline_devices',
        value: 'true',
        data_type: 'boolean',
        description: 'Display offline devices in dashboard',
        ...generateTimestamps(45)
      },
      {
        category: 'dashboard',
        key: 'chart_data_points',
        value: '24',
        data_type: 'integer',
        description: 'Number of data points to show in charts',
        ...generateTimestamps(45)
      },

      // Compliance Configuration
      {
        category: 'compliance',
        key: 'check_frequency',
        value: 'daily',
        data_type: 'string',
        description: 'Default compliance check frequency',
        ...generateTimestamps(70)
      },
      {
        category: 'compliance',
        key: 'min_compliance_score',
        value: '85.0',
        data_type: 'float',
        description: 'Minimum acceptable compliance score',
        ...generateTimestamps(70)
      },
      {
        category: 'compliance',
        key: 'auto_remediation',
        value: 'false',
        data_type: 'boolean',
        description: 'Enable automatic compliance remediation',
        ...generateTimestamps(70)
      },

      // Report Configuration
      {
        category: 'reports',
        key: 'max_report_size_mb',
        value: '50',
        data_type: 'integer',
        description: 'Maximum report file size in MB',
        ...generateTimestamps(55)
      },
      {
        category: 'reports',
        key: 'report_retention_days',
        value: '30',
        data_type: 'integer',
        description: 'Number of days to retain generated reports',
        ...generateTimestamps(55)
      },
      {
        category: 'reports',
        key: 'default_format',
        value: 'pdf',
        data_type: 'string',
        description: 'Default report export format',
        ...generateTimestamps(55)
      },

      // Backup Configuration
      {
        category: 'backup',
        key: 'auto_backup_enabled',
        value: 'true',
        data_type: 'boolean',
        description: 'Enable automatic database backups',
        ...generateTimestamps(95)
      },
      {
        category: 'backup',
        key: 'backup_frequency',
        value: 'daily',
        data_type: 'string',
        description: 'Automatic backup frequency',
        ...generateTimestamps(95)
      },
      {
        category: 'backup',
        key: 'backup_retention_days',
        value: '7',
        data_type: 'integer',
        description: 'Number of days to retain backups',
        ...generateTimestamps(95)
      }
    ];

    const result = await this.db.insertBatch('system_settings', settings, 'DO NOTHING');
    
    const categorySummary = {};
    settings.forEach(setting => {
      categorySummary[setting.category] = (categorySummary[setting.category] || 0) + 1;
    });

    const summaryStr = Object.entries(categorySummary)
      .map(([category, count]) => `${category}(${count})`)
      .join(', ');
    
    return {
      summary: `Created ${result.length} system settings across categories: ${summaryStr}`
    };
  }
}

module.exports = SystemSettingsSeeder;
