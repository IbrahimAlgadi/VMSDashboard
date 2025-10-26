# 🔄 Phase 2: Sequelize Database Integration

## 📋 Overview

Integrate Sequelize ORM to connect the VMS Dashboard to PostgreSQL database.

---

## ✅ Prerequisites

- ✅ Phase 1 completed (MVC structure in place)
- ✅ PostgreSQL installed
- ✅ Database exists (from previous migration.js setup)

---

## 🎯 Phase 2 Objectives

1. **Install Sequelize dependencies**
2. **Create Sequelize configuration**
3. **Convert existing seeders to Sequelize models**
4. **Create Sequelize model files**
5. **Update controllers to use Sequelize instead of mock data**
6. **Test database integration**

---

## 📦 Step 1: Install Dependencies

```bash
npm install sequelize sequelize-cli pg-hstore
```

**Dependencies:**
- `sequelize` - The ORM
- `sequelize-cli` - CLI tools for migrations
- `pg-hstore` - PostgreSQL hstore type support

---

## ⚙️ Step 2: Create Sequelize Configuration

### **2.1 Database Configuration**
Create: `src/config/database.js`

```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vms_dashboard',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
```

---

## 📊 Step 3: Create Sequelize Models

### **3.1 Model Structure**
Create models in `src/models/`:

**Priority Order:**
1. User (no dependencies)
2. Region (no dependencies)
3. Branch (depends on Region)
4. NVR (depends on Branch)
5. Camera (depends on NVR and Branch)
6. Alert (depends on Branch, User)
7. ComplianceRequirement
8. ComplianceResult
9. SecurityEvent
10. AnalyticsData
11. SystemSetting
12. Report
13. AuditLog

### **3.2 Example Model: User**
`src/models/User.js`

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'operator', 'viewer', 'technician'),
    allowNull: false
  },
  department: DataTypes.STRING(50),
  phone: DataTypes.STRING(20),
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: DataTypes.DATE
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = User;
```

---

## 🔗 Step 4: Create Model Associations

Create: `src/models/index.js`

```javascript
const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const Region = require('./Region');
const Branch = require('./Branch');
const NVR = require('./NVR');
const Camera = require('./Camera');
const Alert = require('./Alert');
// ... other models

// Define associations
Region.hasMany(Branch, { foreignKey: 'region_id', as: 'branches' });
Branch.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });

Branch.hasMany(NVR, { foreignKey: 'branch_id', as: 'nvrs' });
NVR.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

NVR.hasMany(Camera, { foreignKey: 'nvr_id', as: 'cameras' });
Camera.belongsTo(NVR, { foreignKey: 'nvr_id', as: 'nvr' });
Camera.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

// Export all models
module.exports = {
  sequelize,
  User,
  Region,
  Branch,
  NVR,
  Camera,
  Alert
  // ... other models
};
```

---

## 🔄 Step 5: Update Controllers to Use Sequelize

### **Example: Dashboard Controller**
`src/controllers/dashboard.controller.js`

```javascript
const { NVR, Camera, Branch } = require('../models');

class DashboardController {
  async showDashboard(req, res) {
    try {
      // Get real data from database
      const totalNVRs = await NVR.count({ where: { is_active: true } });
      const totalCameras = await Camera.count({ where: { is_active: true } });
      const totalBranches = await Branch.count({ where: { is_active: true } });
      
      const dashboardData = {
        kpis: {
          totalNVRs,
          totalCameras,
          totalBranches
        }
      };
      
      res.render('dashboard', {
        title: 'Dashboard',
        currentPage: 'dashboard',
        data: dashboardData
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = new DashboardController();
```

---

## 🧪 Step 6: Test Database Connection

Add to `server.js`:

```javascript
const { sequelize } = require('./src/models');

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync models (development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('📊 Database models synchronized');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 VMS Dashboard ready with Sequelize!`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

## 📝 Implementation Order

### **Sprint 1: Core Models (2-3 hours)**
1. ✅ Install dependencies
2. ✅ Create database.js config
3. ✅ Create User model
4. ✅ Create Region model
5. ✅ Create Branch model
6. ✅ Test basic queries

### **Sprint 2: NVR & Camera Models (2 hours)**
1. ✅ Create NVR model
2. ✅ Create Camera model
3. ✅ Create associations
4. ✅ Update NVR controller
5. ✅ Update Camera controller

### **Sprint 3: Remaining Models (2-3 hours)**
1. ✅ Create Alert model
2. ✅ Create Compliance models
3. ✅ Create SecurityEvent model
4. ✅ Create remaining models
5. ✅ Update all controllers

### **Sprint 4: Testing & Refinement (1-2 hours)**
1. ✅ Test all pages
2. ✅ Verify data loading
3. ✅ Fix any issues
4. ✅ Final testing

**Total Estimated Time: 7-10 hours**

---

## 🎯 Success Criteria

- [ ] All Sequelize models created
- [ ] Models have proper associations
- [ ] Controllers use real database data
- [ ] All pages load with database data
- [ ] No errors in console
- [ ] Database queries are optimized

---

## 🚀 Next Steps

Ready to start implementation?

**Run:**
```bash
npm install sequelize sequelize-cli pg-hstore
```

Then we'll create the models one by one.

---

**Status: READY TO START** ✨
