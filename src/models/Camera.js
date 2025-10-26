const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Camera = sequelize.define('Camera', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nvr_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nvrs',
      key: 'id'
    }
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  position: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  ip_address: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  model: DataTypes.STRING(100),
  manufacturer: DataTypes.STRING(50),
  resolution: DataTypes.STRING(50),
  fps: {
    type: DataTypes.INTEGER,
    defaultValue: 25
  },
  bitrate: DataTypes.INTEGER,
  edge_storage_size: DataTypes.INTEGER,
  uptime_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  }
}, {
  tableName: 'cameras',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Camera;
