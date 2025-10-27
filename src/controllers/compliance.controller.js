const { ComplianceResult, ComplianceRequirement, Branch, Region } = require('../models');
const MOCK_DATA = require('../config/constants');

class ComplianceController {
  // GET /compliance
  async showCompliance(req, res) {
    try {
      // Get all compliance results with related data
      const results = await ComplianceResult.findAll({
        include: [
          { 
            model: ComplianceRequirement, 
            as: 'requirement', 
            attributes: ['id', 'name', 'code', 'description', 'category']
          },
          { 
            model: Branch, 
            as: 'branch', 
            attributes: ['id', 'name', 'region_id'],
            include: [{
              model: Region,
              as: 'region',
              attributes: ['id', 'name']
            }]
          }
        ],
        order: [['check_timestamp', 'DESC']],
        limit: 500
      }).catch(() => []);

      if (results.length > 0) {
        // Calculate overview statistics
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const warning = results.filter(r => r.status === 'warning').length;
        const overallCompliance = ((passed / results.length) * 100).toFixed(0);

        // Group results by requirement
        const requirementGroups = {};
        results.forEach(result => {
          const reqCode = result.requirement?.code || 'unknown';
          if (!requirementGroups[reqCode]) {
            requirementGroups[reqCode] = {
              id: reqCode,
              name: result.requirement?.name || 'Unknown Requirement',
              description: result.requirement?.description || '',
              passed: 0,
              failed: 0,
              warning: 0,
              total: 0
            };
          }
          requirementGroups[reqCode].total++;
          if (result.status === 'passed') requirementGroups[reqCode].passed++;
          else if (result.status === 'failed') requirementGroups[reqCode].failed++;
          else requirementGroups[reqCode].warning++;
        });

        // Convert to array and calculate compliance percentage
        const requirements = Object.values(requirementGroups).map(req => ({
          ...req,
          compliance: Math.round((req.passed / req.total) * 100)
        })).sort((a, b) => b.compliance - a.compliance);

        // Group by region
        const regionGroups = {};
        results.forEach(result => {
          const regionName = result.branch?.region?.name || 'Unknown';
          if (!regionGroups[regionName]) {
            regionGroups[regionName] = {
              region: regionName,
              passed: 0,
              failed: 0,
              warning: 0,
              total: 0,
              nvrs: new Set(),
              cameras: new Set()
            };
          }
          regionGroups[regionName].total++;
          if (result.status === 'passed') regionGroups[regionName].passed++;
          else if (result.status === 'failed') regionGroups[regionName].failed++;
          else regionGroups[regionName].warning++;
          
          // Track unique devices for this branch
          if (result.device_type === 'nvr') {
            regionGroups[regionName].nvrs.add(result.device_id);
          } else if (result.device_type === 'camera') {
            regionGroups[regionName].cameras.add(result.device_id);
          }
        });

        // Convert region groups to array
        const complianceByRegion = Object.values(regionGroups).map(region => ({
          region: region.region,
          nvrs: region.nvrs.size,
          cameras: region.cameras.size,
          compliance: Math.round((region.passed / region.total) * 100),
          passed: region.passed,
          failed: region.failed
        })).sort((a, b) => b.compliance - a.compliance);

        // Structure data for frontend
        const data = {
          overview: {
            overallCompliance: parseInt(overallCompliance),
            totalChecks: results.length,
            passed: passed,
            failed: failed
          },
          requirements: requirements,
          complianceByRegion: complianceByRegion
        };

        res.render('compliance', {
          title: 'Compliance',
          currentPage: 'compliance',
          data: data
        });
      } else {
        // Fallback to mock data
        res.render('compliance', {
          title: 'Compliance',
          currentPage: 'compliance',
          data: MOCK_DATA.compliance
        });
      }
    } catch (error) {
      console.error('Error loading compliance:', error);
      res.render('compliance', {
        title: 'Compliance',
        currentPage: 'compliance',
        data: MOCK_DATA.compliance
      });
    }
  }
}

module.exports = new ComplianceController();
