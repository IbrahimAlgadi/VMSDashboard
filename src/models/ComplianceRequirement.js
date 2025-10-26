const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComplianceRequirement = sequelize.define('ComplianceRequirement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('camera', 'nvr', 'storage', 'network', 'security', 'maintenance'),
    allowNull: false
  },
  applies_to: {
    type: DataTypes.ENUM('camera', 'nvr', 'both'),
    allowNull: false
  },
  required_value: DataTypes.TEXT,
  check_method: {
    type: DataTypes.ENUM('automatic', 'manual', 'hybrid'),
    defaultValue: 'automatic'
  },
  check_frequency: {
    type: DataTypes.ENUM('realtime', 'hourly', 'daily', 'weekly', 'monthly'),
    defaultValue: 'daily'
  },
  severity: {
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
    defaultValue: 'medium'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'compliance_requirements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = ComplianceRequirement;
