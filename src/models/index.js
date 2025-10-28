const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const Region = require('./Region');
const Branch = require('./Branch');
const NVR = require('./NVR');
const NVRHealthMetrics = require('./NVRHealthMetrics');
const Camera = require('./Camera');
const CameraHealthMetrics = require('./CameraHealthMetrics');
const Alert = require('./Alert');
const SecurityEvent = require('./SecurityEvent');
const ComplianceRequirement = require('./ComplianceRequirement');
const ComplianceResult = require('./ComplianceResult');
const Report = require('./Report');
const AnalyticsData = require('./AnalyticsData');
const SystemSetting = require('./SystemSetting');
const AuditLog = require('./AuditLog');

// Define associations
// Region -> Branch (One-to-Many)
Region.hasMany(Branch, { foreignKey: 'region_id', as: 'branches' });
Branch.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });

// Branch -> NVR (One-to-Many)
Branch.hasMany(NVR, { foreignKey: 'branch_id', as: 'nvrs' });
NVR.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

// NVR -> NVRHealthMetrics (One-to-Many)
NVR.hasMany(NVRHealthMetrics, { foreignKey: 'nvr_id', as: 'healthMetrics' });
NVRHealthMetrics.belongsTo(NVR, { foreignKey: 'nvr_id', as: 'nvr' });

// NVR -> Camera (One-to-Many)
NVR.hasMany(Camera, { foreignKey: 'nvr_id', as: 'cameras' });
Camera.belongsTo(NVR, { foreignKey: 'nvr_id', as: 'nvr' });

// Branch -> Camera (One-to-Many)
Branch.hasMany(Camera, { foreignKey: 'branch_id', as: 'cameras' });
Camera.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

// Camera -> CameraHealthMetrics (One-to-Many)
Camera.hasMany(CameraHealthMetrics, { foreignKey: 'camera_id', as: 'healthMetrics' });
CameraHealthMetrics.belongsTo(Camera, { foreignKey: 'camera_id', as: 'camera' });

// Branch -> Alert (One-to-Many)
Branch.hasMany(Alert, { foreignKey: 'branch_id', as: 'alerts' });
Alert.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

// User -> Alert (One-to-Many) - acknowledged
User.hasMany(Alert, { foreignKey: 'acknowledged_by', as: 'acknowledgedAlerts' });
Alert.belongsTo(User, { foreignKey: 'acknowledged_by', as: 'acknowledgedBy' });

// User -> Alert (One-to-Many) - resolved
User.hasMany(Alert, { foreignKey: 'resolved_by', as: 'resolvedAlerts' });
Alert.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolvedBy' });

// Branch -> SecurityEvent (One-to-Many)
Branch.hasMany(SecurityEvent, { foreignKey: 'branch_id', as: 'securityEvents' });
SecurityEvent.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

// User -> SecurityEvent (One-to-Many) - assigned
User.hasMany(SecurityEvent, { foreignKey: 'assigned_to', as: 'assignedSecurityEvents' });
SecurityEvent.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedTo' });

// User -> SecurityEvent (One-to-Many) - resolved
User.hasMany(SecurityEvent, { foreignKey: 'resolved_by', as: 'resolvedSecurityEvents' });
SecurityEvent.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolvedBy' });

// ComplianceRequirement -> ComplianceResult (One-to-Many)
ComplianceRequirement.hasMany(ComplianceResult, { foreignKey: 'requirement_id', as: 'results' });
ComplianceResult.belongsTo(ComplianceRequirement, { foreignKey: 'requirement_id', as: 'requirement' });

// Branch -> ComplianceResult (One-to-Many)
Branch.hasMany(ComplianceResult, { foreignKey: 'branch_id', as: 'complianceResults' });
ComplianceResult.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

// User -> Report (One-to-Many)
User.hasMany(Report, { foreignKey: 'generated_by', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'generated_by', as: 'generatedBy' });

// User -> AuditLog (One-to-Many)
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User -> SystemSetting (One-to-Many)
User.hasMany(SystemSetting, { foreignKey: 'updated_by', as: 'updatedSettings' });
SystemSetting.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedBy' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Region,
  Branch,
  NVR,
  NVRHealthMetrics,
  Camera,
  CameraHealthMetrics,
  Alert,
  SecurityEvent,
  ComplianceRequirement,
  ComplianceResult,
  Report,
  AnalyticsData,
  SystemSetting,
  AuditLog
};
