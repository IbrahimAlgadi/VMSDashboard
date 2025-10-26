const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('uptime', 'compliance', 'security', 'analytics', 'maintenance', 'custom'),
    allowNull: false
  },
  format: {
    type: DataTypes.ENUM('pdf', 'excel', 'csv', 'json'),
    defaultValue: 'pdf'
  },
  parameters: {
    type: DataTypes.JSON
  },
  date_range_start: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  date_range_end: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'generating', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  file_path: DataTypes.STRING(500),
  file_size: DataTypes.INTEGER,
  generated_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  generated_at: DataTypes.DATE,
  expires_at: DataTypes.DATE,
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Report;
