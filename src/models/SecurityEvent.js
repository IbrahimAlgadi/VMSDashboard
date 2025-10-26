const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SecurityEvent = sequelize.define('SecurityEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  event_type: {
    type: DataTypes.ENUM('weak_password', 'http_access', 'rtsp_tls', 'srtp_encryption', 'firmware_outdated', 'audit_logging', 'unauthorized_access', 'tls_missing', 'audit_disabled'),
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
    allowNull: false
  },
  device_type: {
    type: DataTypes.ENUM('camera', 'nvr', 'system'),
    allowNull: false
  },
  device_id: DataTypes.INTEGER,
  device_name: DataTypes.STRING(100),
  branch_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  source_ip: DataTypes.STRING(15),
  detection_method: {
    type: DataTypes.ENUM('automatic', 'manual', 'external'),
    defaultValue: 'automatic'
  },
  status: {
    type: DataTypes.ENUM('active', 'investigating', 'resolved', 'false_positive'),
    defaultValue: 'active'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolved_at: DataTypes.DATE,
  resolution_notes: DataTypes.TEXT
}, {
  tableName: 'security_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = SecurityEvent;
