const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComplianceResult = sequelize.define('ComplianceResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requirement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'compliance_requirements',
      key: 'id'
    }
  },
  device_type: {
    type: DataTypes.ENUM('camera', 'nvr'),
    allowNull: false
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('passed', 'failed', 'warning', 'not_applicable'),
    allowNull: false
  },
  actual_value: DataTypes.TEXT,
  expected_value: DataTypes.TEXT,
  details: DataTypes.TEXT,
  check_timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  next_check: DataTypes.DATE
}, {
  tableName: 'compliance_results',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = ComplianceResult;
