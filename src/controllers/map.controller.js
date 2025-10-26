const { Branch, Region, NVR, Camera } = require('../models');
const MOCK_DATA = require('../config/constants');

class MapController {
  // GET /map
  async showMap(req, res) {
    try {
      // Fetch all active branches with their region
      const branches = await Branch.findAll({
        include: [{
          model: Region,
          as: 'region',
          attributes: ['id', 'name']
        }],
        where: { is_active: true },
        attributes: ['id', 'name', 'address', 'coordinates', 'branch_type']
      }).catch(() => []);

      if (branches.length === 0) {
        res.render('map', {
          title: 'Location Map',
          currentPage: 'map',
          locations: MOCK_DATA.locations?.locations || [],
          summary: MOCK_DATA.locations?.summary || { total: 0, online: 0, offline: 0, warning: 0 }
        });
        return;
      }

      // For each branch, get NVR and camera stats
      const locations = await Promise.all(branches.map(async (branch) => {
        const branchId = branch.id;
        
        // Get NVRs for this branch
        const nvrs = await NVR.findAll({
          where: { branch_id: branchId, is_active: true },
          attributes: ['id', 'status']
        }).catch(() => []);

        // Get Cameras for this branch
        const cameras = await Camera.findAll({
          where: { branch_id: branchId },
          attributes: ['id', 'status']
        }).catch(() => []);

        // Calculate NVR status counts
        const nvrStatus = {
          online: nvrs.filter(n => n.status === 'online').length,
          offline: nvrs.filter(n => n.status === 'offline').length,
          warning: nvrs.filter(n => n.status === 'warning').length
        };

        // Calculate Camera status counts
        const cameraStatus = {
          online: cameras.filter(c => c.status === 'online').length,
          offline: cameras.filter(c => c.status === 'offline').length,
          warning: cameras.filter(c => c.status === 'warning').length
        };

        // Determine overall branch status
        let status = 'online';
        if (nvrStatus.offline === nvrs.length) {
          status = 'offline';
        } else if (nvrStatus.warning > 0 || cameraStatus.offline > 0) {
          status = 'warning';
        }

        // Parse coordinates (assuming JSON format: "[lat, lng]" or {lat, lng})
        let coordinates = [24.7136, 46.6753]; // Default to Riyadh
        try {
          if (typeof branch.coordinates === 'string') {
            coordinates = JSON.parse(branch.coordinates);
          } else if (typeof branch.coordinates === 'object' && branch.coordinates !== null) {
            coordinates = branch.coordinates.lat && branch.coordinates.lng 
              ? [branch.coordinates.lat, branch.coordinates.lng]
              : branch.coordinates;
          }
        } catch (e) {
          console.error('Error parsing coordinates:', e);
        }

        return {
          id: branch.id,
          name: branch.name,
          region: branch.region?.name || 'Unknown',
          address: branch.address,
          coordinates: coordinates,
          status: status,
          nvrs: nvrs.length,
          cameras: cameras.length,
          branch_type: branch.branch_type,
          nvrStatus: nvrStatus,
          cameraStatus: cameraStatus
        };
      }));

      // Calculate summary statistics
      const summary = {
        total: locations.length,
        online: locations.filter(l => l.status === 'online').length,
        offline: locations.filter(l => l.status === 'offline').length,
        warning: locations.filter(l => l.status === 'warning').length,
        totalNVRs: locations.reduce((sum, l) => sum + l.nvrs, 0),
        totalCameras: locations.reduce((sum, l) => sum + l.cameras, 0)
      };

      res.render('map', {
        title: 'Location Map',
        currentPage: 'map',
        locations: locations,
        summary: summary
      });
    } catch (error) {
      console.error('Error loading map data:', error);
      res.render('map', {
        title: 'Location Map',
        currentPage: 'map',
        locations: MOCK_DATA.locations?.locations || [],
        summary: MOCK_DATA.locations?.summary || { total: 0, online: 0, offline: 0, warning: 0 }
      });
    }
  }
}

module.exports = new MapController();
