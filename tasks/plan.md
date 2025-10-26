Excellent choice! Sequelize is **battle-tested**, **stable**, and perfect for your PostgreSQL VMS dashboard. Let me show you the complete code structure.

[2 tools called]

## 🏗️ **Complete Sequelize Code Structure for Your VMS Dashboard**

Perfect choice! Here's the **complete folder structure** that transforms your current setup into a professional Sequelize-based architecture:

---

## 📁 **Updated Project Structure**

```
bootstrap-vms-dashboard/
│
├── src/
│   ├── app.js                 # Express app initialization
│   ├── server.js              # Server startup
│   │
│   ├── config/
│   │   ├── database.js        # Sequelize configuration
│   │   └── env.js            # Environment variables
│   │
│   ├── models/               # Sequelize models
│   │   ├── index.js          # Model associations & exports
│   │   ├── User.js
│   │   ├── Region.js
│   │   ├── Branch.js
│   │   ├── NVR.js
│   │   ├── Camera.js
│   │   ├── Alert.js
│   │   ├── ComplianceRequirement.js
│   │   ├── ComplianceResult.js
│   │   ├── SecurityEvent.js
│   │   ├── AnalyticsData.js
│   │   ├── SystemSetting.js
│   │   ├── Report.js
│   │   └── AuditLog.js
│   │
│   ├── controllers/          # Request handlers
│   │   ├── dashboard.controller.js
│   │   ├── nvr.controller.js
│   │   ├── camera.controller.js
│   │   ├── alert.controller.js
│   │   ├── compliance.controller.js
│   │   ├── security.controller.js
│   │   ├── analytics.controller.js
│   │   └── report.controller.js
│   │
│   ├── services/             # Business logic
│   │   ├── dashboard.service.js
│   │   ├── nvr.service.js
│   │   ├── camera.service.js
│   │   ├── alert.service.js
│   │   ├── compliance.service.js
│   │   └── analytics.service.js
│   │
│   ├── routes/               # Route definitions
│   │   ├── index.js
│   │   ├── dashboard.routes.js
│   │   ├── nvr.routes.js
│   │   ├── camera.routes.js
│   │   ├── alert.routes.js
│   │   └── api.routes.js
│   │
│   ├── middlewares/          # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── seeders/              # Sequelize seeders (your current ones)
│   │   ├── 20241201000001-users.js
│   │   ├── 20241201000002-regions.js
│   │   ├── 20241201000003-branches.js
│   │   └── ...
│   │
│   ├── migrations/           # Database migrations
│   │   ├── 20241201000001-create-users.js
│   │   ├── 20241201000002-create-regions.js
│   │   └── ...
│   │
│   └── utils/
│       ├── helpers.js        # Your existing helpers
│       └── logger.js
│
├── views/                    # Keep your existing Nunjucks templates
├── public/                   # Keep your existing static files
├── .env
├── package.json
└── server.js                 # Entry point
```

---

## ⚙️ **1. Package.json Dependencies**

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "nunjucks": "^3.2.4",
    "sequelize": "^6.35.0",
    "pg": "^8.16.3",
    "pg-hstore": "^2.3.4",
    "dotenv": "^16.3.1",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "sequelize-cli": "^6.6.2",
    "nodemon": "^3.0.2"
  }
}
```

---

## 🗄️ **2. Database Configuration**

**`src/config/database.js`**
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
  define: {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  },
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

## 📋 **3. Sequelize Models (Based on Your Schema)**

**`src/models/User.js`**
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
  department: {
    type: DataTypes.STRING(50)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['username'] },
    { fields: ['email'] },
    { fields: ['role'] }
  ]
});

module.exports = User;
```

**`src/models/NVR.js`**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NVR = sequelize.define('NVR', {
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
  mac_address: {
    type: DataTypes.STRING(17)
  },
  model: {
    type: DataTypes.STRING(100)
  },
  manufacturer: {
    type: DataTypes.STRING(50)
  },
  firmware_version: {
    type: DataTypes.STRING(20)
  },
  serial_number: {
    type: DataTypes.STRING(50),
    unique: true
  },
  max_cameras: {
    type: DataTypes.INTEGER,
    defaultValue: 16
  },
  current_cameras: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  storage_total_gb: {
    type: DataTypes.INTEGER
  },
  storage_used_gb: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  storage_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'warning', 'error'),
    defaultValue: 'offline'
  },
  uptime_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  last_seen: {
    type: DataTypes.DATE
  },
  installation_date: {
    type: DataTypes.DATEONLY
  },
  warranty_expiry: {
    type: DataTypes.DATEONLY
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'nvrs',
  indexes: [
    { fields: ['branch_id'] },
    { fields: ['ip_address'] },
    { fields: ['status'] },
    { fields: ['last_seen'] }
  ]
});

module.exports = NVR;
```

**`src/models/Camera.js`**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Camera = sequelize.define('Camera', {
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
  channel_number: {
    type: DataTypes.INTEGER,
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
  mac_address: {
    type: DataTypes.STRING(17)
  },
  model: {
    type: DataTypes.STRING(100)
  },
  manufacturer: {
    type: DataTypes.STRING(50)
  },
  resolution: {
    type: DataTypes.STRING(20)
  },
  fps: {
    type: DataTypes.INTEGER,
    defaultValue: 25
  },
  lens_size: {
    type: DataTypes.STRING(10)
  },
  ptz_capable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  night_vision: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  audio_recording: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  motion_detection: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  recording_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'warning', 'error'),
    defaultValue: 'offline'
  },
  uptime_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  last_seen: {
    type: DataTypes.DATE
  },
  installation_date: {
    type: DataTypes.DATEONLY
  },
  warranty_expiry: {
    type: DataTypes.DATEONLY
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'cameras',
  indexes: [
    { fields: ['nvr_id'] },
    { fields: ['branch_id'] },
    { fields: ['ip_address'] },
    { fields: ['status'] },
    { fields: ['last_seen'] },
    { unique: true, fields: ['nvr_id', 'channel_number'] }
  ]
});

module.exports = Camera;
```

**`src/models/index.js`** - **Model Associations**
```javascript
const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const Region = require('./Region');
const Branch = require('./Branch');
const NVR = require('./NVR');
const Camera = require('./Camera');
const Alert = require('./Alert');
// ... import other models

// Define associations
Region.hasMany(Branch, { foreignKey: 'region_id', as: 'branches' });
Branch.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });

Branch.hasMany(NVR, { foreignKey: 'branch_id', as: 'nvrs' });
NVR.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

Branch.hasMany(Camera, { foreignKey: 'branch_id', as: 'cameras' });
Camera.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

NVR.hasMany(Camera, { foreignKey: 'nvr_id', as: 'cameras' });
Camera.belongsTo(NVR, { foreignKey: 'nvr_id', as: 'nvr' });

// Alert associations
Branch.hasMany(Alert, { foreignKey: 'branch_id', as: 'alerts' });
Alert.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

User.hasMany(Alert, { foreignKey: 'acknowledged_by', as: 'acknowledgedAlerts' });
User.hasMany(Alert, { foreignKey: 'resolved_by', as: 'resolvedAlerts' });

// Export models and sequelize
module.exports = {
  sequelize,
  User,
  Region,
  Branch,
  NVR,
  Camera,
  Alert,
  // ... export other models
};
```

---

## 🔧 **4. Convert Your Seeders to Sequelize**

**`src/seeders/20241201000001-users.js`**
```javascript
const { generateTimestamps, generateSaudiPhone } = require('../utils/helpers');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = [
      {
        username: 'admin',
        email: 'admin@vms-dashboard.sa',
        password_hash: '$2b$10$8K1p/a0dTjbzKqL8w9vXHu123456789abcdefghijk',
        full_name: 'System Administrator',
        role: 'admin',
        department: 'IT Security',
        phone: '+966-11-2345678',
        is_active: true,
        last_login: new Date(Date.now() - 2 * 60 * 60 * 1000),
        ...generateTimestamps(90)
      },
      // ... rest of your user data from seeders/01-users.js
    ];

    await queryInterface.bulkInsert('users', users, {
      ignoreDuplicates: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
```

---

## 🎮 **5. Controllers Using Sequelize**

**`src/controllers/nvr.controller.js`**
```javascript
const { NVR, Branch, Camera, Region } = require('../models');
const nvrService = require('../services/nvr.service');

class NVRController {
  // GET /api/nvrs - List all NVRs with relationships
  async getAllNVRs(req, res, next) {
    try {
      const nvrs = await NVR.findAll({
        include: [
          {
            model: Branch,
            as: 'branch',
            include: [{ model: Region, as: 'region' }]
          },
          {
            model: Camera,
            as: 'cameras',
            where: { is_active: true },
            required: false
          }
        ],
        where: { is_active: true },
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: nvrs,
        total: nvrs.length
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/nvrs/:id - Get single NVR with details
  async getNVRById(req, res, next) {
    try {
      const { id } = req.params;
      
      const nvr = await nvrService.findNVRWithDetails(id);
      
      if (!nvr) {
        return res.status(404).json({
          success: false,
          message: 'NVR not found'
        });
      }

      res.json({
        success: true,
        data: nvr
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/nvrs - Create new NVR
  async createNVR(req, res, next) {
    try {
      const nvrData = req.body;
      const nvr = await NVR.create(nvrData);
      
      res.status(201).json({
        success: true,
        data: nvr,
        message: 'NVR created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/nvrs/:id - Update NVR
  async updateNVR(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const [updatedRows] = await NVR.update(updateData, {
        where: { id },
        returning: true
      });

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'NVR not found'
        });
      }

      const updatedNVR = await NVR.findByPk(id, {
        include: [{ model: Branch, as: 'branch' }]
      });

      res.json({
        success: true,
        data: updatedNVR,
        message: 'NVR updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NVRController();
```

---

## 🔄 **6. Services Layer**

**`src/services/nvr.service.js`**
```javascript
const { NVR, Branch, Camera, Region, Alert } = require('../models');
const { Op } = require('sequelize');

class NVRService {
  async findNVRWithDetails(id) {
    return await NVR.findByPk(id, {
      include: [
        {
          model: Branch,
          as: 'branch',
          include: [{ model: Region, as: 'region' }]
        },
        {
          model: Camera,
          as: 'cameras',
          where: { is_active: true },
          required: false
        }
      ]
    });
  }

  async getNVRsByStatus(status) {
    return await NVR.findAll({
      where: { status, is_active: true },
      include: [{ model: Branch, as: 'branch' }]
    });
  }

  async getNVRsWithHighStorageUsage(threshold = 80) {
    return await NVR.findAll({
      where: {
        storage_percent: { [Op.gte]: threshold },
        is_active: true
      },
      include: [{ model: Branch, as: 'branch' }],
      order: [['storage_percent', 'DESC']]
    });
  }

  async getDashboardStats() {
    const stats = await NVR.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { is_active: true },
      group: ['status'],
      raw: true
    });

    return {
      total: await NVR.count({ where: { is_active: true } }),
      online: stats.find(s => s.status === 'online')?.count || 0,
      offline: stats.find(s => s.status === 'offline')?.count || 0,
      warning: stats.find(s => s.status === 'warning')?.count || 0,
      error: stats.find(s => s.status === 'error')?.count || 0
    };
  }
}

module.exports = new NVRService();
```

---

## 🌐 **7. Updated Server.js**

**`server.js`** (Updated to use Sequelize)
```javascript
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const { sequelize } = require('./src/models');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Nunjucks
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: true,
  noCache: true
});

app.set('view engine', 'njk');
app.use(express.static('public'));
app.use('/data', express.static('data'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const routes = require('./src/routes');
app.use('/api', routes);

// Your existing view routes (keep as-is)
app.get('/', async (req, res) => {
  // Now you can use Sequelize models for real data
  const { NVR, Camera, Branch } = require('./src/models');
  
  const dashboardData = {
    totalNVRs: await NVR.count({ where: { is_active: true } }),
    totalCameras: await Camera.count({ where: { is_active: true } }),
    totalBranches: await Branch.count({ where: { is_active: true } })
  };

  res.render('dashboard', {
    title: 'Dashboard',
    currentPage: 'dashboard',
    data: dashboardData
  });
});

// ... your other view routes

// Error handlers
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: '404 Not Found',
    currentPage: 'error'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', {
    title: '500 Server Error',
    currentPage: 'error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Database connection and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync models (only in development)
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

module.exports = app;
```

---

## 🚀 **8. Benefits You'll Get**

1. **Easy Relationships**: `nvr.getCameras()`, `branch.getNvrs()`
2. **Built-in Validation**: Model-level validations
3. **Powerful Queries**: Complex joins made simple
4. **Migration Management**: Proper database versioning
5. **Type Safety**: Better IDE support and error catching

**Your Current Seeder vs Sequelize:**
```javascript
// Old way:
await this.db.insertBatch('nvrs', nvrs, 'DO NOTHING');

// New way:
await NVR.bulkCreate(nvrs, { ignoreDuplicates: true });

// Complex queries made easy:
const branchStats = await Branch.findAll({
  include: [
    { model: NVR, as: 'nvrs' },
    { model: Camera, as: 'cameras' }
  ],
  attributes: {
    include: [
      [sequelize.fn('COUNT', sequelize.col('nvrs.id')), 'nvr_count'],
      [sequelize.fn('COUNT', sequelize.col('cameras.id')), 'camera_count']
    ]
  },
  group: ['Branch.id']
});
```

Would you like me to show you the **complete migration commands** to set this up, or focus on any specific part of this structure?