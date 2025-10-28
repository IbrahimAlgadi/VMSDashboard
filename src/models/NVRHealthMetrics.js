const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NVRHealthMetrics = sequelize.define('NVRHealthMetrics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nvr_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nvrs',
      key: 'id'
    }
  },
  // System Health Metrics
  cpu_usage_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  memory_usage_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  disk_io_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  // Storage Information
  storage_used_gb: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  storage_total_gb: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  // Network Statistics
  bandwidth_in_mbps: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  bandwidth_out_mbps: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  packets_sent: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  packets_received: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  // Real-time Status
  connection_status: {
    type: DataTypes.ENUM('connected', 'disconnected', 'unstable'),
    allowNull: false,
    defaultValue: 'disconnected'
  },
  recording_status: {
    type: DataTypes.ENUM('recording', 'stopped', 'error', 'paused'),
    allowNull: false,
    defaultValue: 'stopped'
  },
  // Health Check Information
  last_health_check: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  health_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  // Additional Metrics
  temperature_celsius: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  fan_speed_rpm: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  power_consumption_watts: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  // Metadata
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'nvr_health_metrics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      fields: ['nvr_id']
    },
    {
      fields: ['last_health_check']
    },
    {
      fields: ['health_score']
    }
  ]
});

module.exports = NVRHealthMetrics;
