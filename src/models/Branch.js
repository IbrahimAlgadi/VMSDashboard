const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  region_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'regions',
      key: 'id'
    }
  },
  branch_code: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  branch_type: {
    type: DataTypes.ENUM('Main Branch', 'Branch', 'ATM'),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: false
  },
  contact_phone: DataTypes.STRING(20),
  manager_name: DataTypes.STRING(100),
  operating_hours: {
    type: DataTypes.JSON
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'warning', 'maintenance'),
    defaultValue: 'offline'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'branches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Branch;
