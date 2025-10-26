const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Region = sequelize.define('Region', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false
  },
  description: DataTypes.TEXT,
  coordinates: {
    type: DataTypes.JSON
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Asia/Riyadh'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'regions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Region;
