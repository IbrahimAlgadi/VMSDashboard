const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NVR = sequelize.define('NVR', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  device_name: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  hostname: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  processor: DataTypes.STRING(100),
  ram: DataTypes.STRING(20),
  device_id: DataTypes.STRING(50),
  product_id: DataTypes.STRING(100),
  system_type: DataTypes.STRING(100),
  securos_version: DataTypes.STRING(20),
  previous_maintenance_date: DataTypes.DATEONLY,
  maintenance_period_days: DataTypes.INTEGER,
  next_maintenance_date: DataTypes.DATEONLY,
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  ip_address: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  max_cameras: {
    type: DataTypes.INTEGER,
    defaultValue: 16
  },
  current_cameras: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'warning', 'error'),
    defaultValue: 'offline'
  },
  uptime_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  last_seen: DataTypes.DATE,
  installation_date: DataTypes.DATEONLY,
  warranty_expiry: DataTypes.DATEONLY,
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'nvrs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = NVR;
