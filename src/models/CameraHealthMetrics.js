const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CameraHealthMetrics = sequelize.define('CameraHealthMetrics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  camera_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cameras',
      key: 'id'
    }
  },
  ping_ms: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  packet_loss_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  bandwidth_mbps: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  bitrate_kbps: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  frame_drop_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  quality_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  recording_time_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  space_used_gb: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  retention_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30
  },
  motion_events_today: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  alerts_pending: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  last_reboot_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  last_health_check: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'camera_health_metrics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      fields: ['camera_id']
    },
    {
      fields: ['last_health_check']
    },
    {
      fields: ['quality_score']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = CameraHealthMetrics;
