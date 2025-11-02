const { Branch, Region } = require('../models');

class BranchController {
  // GET /api/branches - Get all branches
  async getAllBranches(req, res) {
    try {
      const { region_id, branch_type, status, is_active } = req.query;

      const where = {};
      if (region_id) where.region_id = region_id;
      if (branch_type) where.branch_type = branch_type;
      if (status) where.status = status;
      if (is_active !== undefined) where.is_active = is_active === 'true';

      const branches = await Branch.findAll({
        include: [{
          model: Region,
          as: 'region',
          attributes: ['id', 'name', 'code']
        }],
        where,
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: branches
      });

    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching branches'
      });
    }
  }

  // GET /api/branches/:id - Get branch by ID
  async getBranchById(req, res) {
    try {
      const { id } = req.params;

      const branch = await Branch.findByPk(id, {
        include: [{
          model: Region,
          as: 'region',
          attributes: ['id', 'name', 'code', 'description']
        }]
      });

      if (!branch) {
        return res.status(404).json({
          success: false,
          message: `Branch with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        data: branch
      });

    } catch (error) {
      console.error('Error fetching branch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching branch'
      });
    }
  }

  // POST /api/branches - Create new branch
  async createBranch(req, res) {
    try {
      const {
        name,
        region_id,
        branch_code,
        branch_type,
        address,
        coordinates,
        contact_phone,
        manager_name,
        operating_hours,
        status = 'offline',
        is_active = true
      } = req.body;

      // Validate required fields
      if (!name || !region_id || !branch_code || !branch_type || !address || !coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Name, region ID, branch code, branch type, address, and coordinates are required'
        });
      }

      // Validate branch_type
      if (!['Main Branch', 'Branch', 'ATM'].includes(branch_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch type. Must be one of: Main Branch, Branch, ATM'
        });
      }

      // Validate status
      if (status && !['online', 'offline', 'warning', 'maintenance'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: online, offline, warning, maintenance'
        });
      }

      // Check if branch_code already exists
      const existingCode = await Branch.findOne({
        where: { branch_code }
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'A branch with this branch code already exists'
        });
      }

      // Verify region exists
      const region = await Region.findByPk(region_id);
      if (!region) {
        return res.status(400).json({
          success: false,
          message: 'Selected region does not exist'
        });
      }

      // Ensure coordinates is valid JSON
      let coordinatesData = coordinates;
      if (typeof coordinates === 'string') {
        try {
          coordinatesData = JSON.parse(coordinates);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Coordinates must be valid JSON'
          });
        }
      }

      // Ensure operating_hours is valid JSON if provided
      let operatingHoursData = operating_hours;
      if (operating_hours && typeof operating_hours === 'string') {
        try {
          operatingHoursData = JSON.parse(operating_hours);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Operating hours must be valid JSON'
          });
        }
      }

      // Create the branch
      const newBranch = await Branch.create({
        name,
        region_id,
        branch_code,
        branch_type,
        address,
        coordinates: coordinatesData,
        contact_phone,
        manager_name,
        operating_hours: operatingHoursData,
        status,
        is_active
      });

      // Fetch with region info
      const branchWithRegion = await Branch.findByPk(newBranch.id, {
        include: [{
          model: Region,
          as: 'region',
          attributes: ['id', 'name', 'code']
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Branch created successfully',
        data: branchWithRegion
      });

    } catch (error) {
      console.error('Error creating branch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating branch'
      });
    }
  }

  // PATCH /api/branches/:id - Update branch by ID
  async updateBranch(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const branch = await Branch.findByPk(id);

      if (!branch) {
        return res.status(404).json({
          success: false,
          message: `Branch with ID ${id} not found`
        });
      }

      // Validate branch_type if provided
      if (updateData.branch_type && !['Main Branch', 'Branch', 'ATM'].includes(updateData.branch_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch type. Must be one of: Main Branch, Branch, ATM'
        });
      }

      // Validate status if provided
      if (updateData.status && !['online', 'offline', 'warning', 'maintenance'].includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: online, offline, warning, maintenance'
        });
      }

      // Check if branch_code is being updated and already exists
      if (updateData.branch_code && updateData.branch_code !== branch.branch_code) {
        const existingCode = await Branch.findOne({
          where: { branch_code: updateData.branch_code }
        });

        if (existingCode) {
          return res.status(400).json({
            success: false,
            message: 'A branch with this branch code already exists'
          });
        }
      }

      // Verify region exists if region_id is being updated
      if (updateData.region_id && updateData.region_id !== branch.region_id) {
        const region = await Region.findByPk(updateData.region_id);
        if (!region) {
          return res.status(400).json({
            success: false,
            message: 'Selected region does not exist'
          });
        }
      }

      // Parse JSON fields if they are strings
      if (updateData.coordinates && typeof updateData.coordinates === 'string') {
        try {
          updateData.coordinates = JSON.parse(updateData.coordinates);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Coordinates must be valid JSON'
          });
        }
      }

      if (updateData.operating_hours && typeof updateData.operating_hours === 'string') {
        try {
          updateData.operating_hours = JSON.parse(updateData.operating_hours);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Operating hours must be valid JSON'
          });
        }
      }

      // Update the branch
      await branch.update(updateData);

      // Fetch updated branch with region info
      const updatedBranch = await Branch.findByPk(id, {
        include: [{
          model: Region,
          as: 'region',
          attributes: ['id', 'name', 'code']
        }]
      });

      res.json({
        success: true,
        message: 'Branch updated successfully',
        data: updatedBranch
      });

    } catch (error) {
      console.error('Error updating branch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating branch'
      });
    }
  }

  // DELETE /api/branches/:id - Delete branch by ID
  async deleteBranch(req, res) {
    try {
      const { id } = req.params;

      const branch = await Branch.findByPk(id);

      if (!branch) {
        return res.status(404).json({
          success: false,
          message: `Branch with ID ${id} not found`
        });
      }

      // Check if branch has associated NVRs or cameras (soft delete by setting is_active to false)
      // Or hard delete if explicitly requested
      const { hardDelete } = req.query;

      if (hardDelete === 'true') {
        // Hard delete - will cascade delete related records due to foreign key constraints
        await branch.destroy();
        return res.json({
          success: true,
          message: 'Branch deleted successfully'
        });
      } else {
        // Soft delete - set is_active to false
        await branch.update({ is_active: false });
        return res.json({
          success: true,
          message: 'Branch deactivated successfully',
          data: {
            id: branch.id,
            name: branch.name,
            is_active: false
          }
        });
      }

    } catch (error) {
      console.error('Error deleting branch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting branch'
      });
    }
  }
}

module.exports = new BranchController();
