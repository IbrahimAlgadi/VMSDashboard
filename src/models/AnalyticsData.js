const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AnalyticsData = sequelize.define('AnalyticsData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  metric_type: {
    type: DataTypes.ENUM('uptime', 'alerts', 'storage', 'network', 'performance', 'compliance'),
    allowNull: false
  },
  metric_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entity_type: {
    type: DataTypes.ENUM('system', 'region', 'branch', 'nvr', 'camera'),
    allowNull: false
  },
  entity_id: DataTypes.INTEGER,
  value: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false
  },
  unit: DataTypes.STRING(20),
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  aggregation_period: {
    type: DataTypes.ENUM('minute', 'hour', 'day', 'week', 'month'),
    defaultValue: 'hour'
  },
  metadata: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'analytics_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = AnalyticsData;
