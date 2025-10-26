# Sprint 3: Switch from Mock Data to Database

## 🎯 Goal
Update all controllers to fetch data from PostgreSQL database using Sequelize instead of mock data.

## 📋 Controllers to Update

### **Priority 1: Core Controllers**
1. ✅ Dashboard Controller - Count KPIs from database
2. ✅ NVR Controller - List NVRs from database
3. ✅ Camera Controller - List cameras from database
4. ✅ Map Controller - Get NVR locations from database
5. ✅ Alerts Controller - Fetch alerts from database

### **Priority 2: Management Controllers**
6. ✅ Compliance Controller - Fetch compliance results
7. ✅ Security Controller - Fetch security events
8. ✅ Analytics Controller - Fetch analytics data

### **Priority 3: Utility Controllers**
9. ✅ Reports Controller - Fetch reports from database
10. ✅ Profile Controller - Get user profile
11. ✅ Settings Controller - Get settings from database

## 🚀 Approach

For each controller:
1. Import required Sequelize models
2. Replace mock data with Sequelize queries
3. Handle async/await properly
4. Add error handling with try-catch
5. Keep the same response structure for views

## 📊 Data Sources

- **Dashboard**: Count from NVR, Camera, Branch tables
- **NVRs**: NVR table with Branch relationship
- **Cameras**: Camera table with NVR and Branch relationships
- **Alerts**: Alert table with Branch relationship
- **Compliance**: ComplianceResult table
- **Security**: SecurityEvent table
- **Map**: Branch and NVR coordinates

## ⚠️ Important Notes

Since we're using `force: false` in sync, we need to ensure tables exist first.
For now, we'll update the code structure - tables can be created later.

---

**Status: Ready to start implementation**
