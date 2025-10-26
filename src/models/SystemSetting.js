const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  value: DataTypes.TEXT,
  data_type: {
    type: DataTypes.ENUM('string', 'integer', 'float', 'boolean', 'json'),
    defaultValue: 'string'
  },
  description: DataTypes.TEXT,
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_editable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = SystemSetting;
