const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('camera_offline', 'nvr_offline', 'storage_warning', 'motion_detected', 'network_issue', 'maintenance', 'security', 'system_error', 'power_issue', 'firmware_update'),
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low', 'info'),
    allowNull: false
  },
  source_type: {
    type: DataTypes.ENUM('camera', 'nvr', 'system', 'network', 'user'),
    allowNull: false
  },
  source_id: DataTypes.INTEGER,
  branch_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'acknowledged', 'resolved', 'dismissed'),
    defaultValue: 'active'
  },
  acknowledged_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  acknowledged_at: DataTypes.DATE,
  resolved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolved_at: DataTypes.DATE,
  resolution_notes: DataTypes.TEXT,
  auto_resolve: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Alert;
