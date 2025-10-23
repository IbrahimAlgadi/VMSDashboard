const { 
  generateTimestamps, 
  randomChoice, 
  randomInt,
  randomDecimal 
} = require('./utils/helpers');

class ComplianceResultsSeeder {
  constructor(db) {
    this.db = db;
  }

  async run() {
    // Get required data from database
    const [requirementsResult, branchesResult, camerasResult, nvrsResult] = await Promise.all([
      this.db.query('SELECT id, code, applies_to, severity, check_frequency FROM compliance_requirements WHERE is_active = true ORDER BY id'),
      this.db.query('SELECT id, name FROM branches ORDER BY id'),
      this.db.query('SELECT id, name, branch_id FROM cameras ORDER BY id'),
      this.db.query('SELECT id, device_name, branch_id FROM nvrs ORDER BY id')
    ]);

    const requirements = requirementsResult.rows;
    const branches = branchesResult.rows;
    const cameras = camerasResult.rows;
    const nvrs = nvrsResult.rows;

    if (requirements.length === 0 || branches.length === 0) {
      throw new Error('Missing requirements or branches. Please run previous seeders first.');
    }

    const results = [];

    // Generate compliance results for each requirement
    for (const requirement of requirements) {
      let devices = [];
      
      // Determine which devices to check based on applies_to
      if (requirement.applies_to === 'camera') {
        devices = cameras.map(c => ({ ...c, device_type: 'camera' }));
      } else if (requirement.applies_to === 'nvr') {
        devices = nvrs.map(n => ({ ...n, device_type: 'nvr' }));
      } else if (requirement.applies_to === 'both') {
        devices = [
          ...cameras.map(c => ({ ...c, device_type: 'camera' })),
          ...nvrs.map(n => ({ ...n, device_type: 'nvr' }))
        ];
      }

      // Generate results for each applicable device
      for (const device of devices) {
        // Determine compliance status based on requirement severity and random factors
        let status;
        const rand = Math.random();
        
        if (requirement.severity === 'critical') {
          // Critical requirements have higher pass rate
          status = rand < 0.85 ? 'passed' : randomChoice(['failed', 'warning']);
        } else if (requirement.severity === 'high') {
          status = rand < 0.80 ? 'passed' : randomChoice(['failed', 'warning']);
        } else if (requirement.severity === 'medium') {
          status = rand < 0.75 ? 'passed' : randomChoice(['failed', 'warning', 'not_applicable']);
        } else {
          status = rand < 0.70 ? 'passed' : randomChoice(['failed', 'warning', 'not_applicable']);
        }

        // Generate realistic actual and expected values based on requirement code
        const { actualValue, expectedValue, details } = this.generateComplianceValues(requirement.code, status);

        // Calculate check timestamp based on frequency
        const now = new Date();
        let daysAgo;
        switch (requirement.check_frequency) {
          case 'realtime':
          case 'hourly':
            daysAgo = randomDecimal(0, 0.5); // Within last 12 hours
            break;
          case 'daily':
            daysAgo = randomInt(1, 7); // Within last week
            break;
          case 'weekly':
            daysAgo = randomInt(1, 14); // Within last 2 weeks
            break;
          case 'monthly':
            daysAgo = randomInt(1, 30); // Within last month
            break;
          default:
            daysAgo = randomInt(1, 7);
        }

        const checkTimestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        // Calculate next check
        let nextCheckDays;
        switch (requirement.check_frequency) {
          case 'realtime':
            nextCheckDays = 0.04; // 1 hour
            break;
          case 'hourly':
            nextCheckDays = 0.04; // 1 hour
            break;
          case 'daily':
            nextCheckDays = 1;
            break;
          case 'weekly':
            nextCheckDays = 7;
            break;
          case 'monthly':
            nextCheckDays = 30;
            break;
          default:
            nextCheckDays = 1;
        }

        const nextCheck = new Date(checkTimestamp.getTime() + nextCheckDays * 24 * 60 * 60 * 1000);

        const result = {
          requirement_id: requirement.id,
          branch_id: device.branch_id,
          device_type: device.device_type,
          device_id: device.id,
          status: status,
          actual_value: actualValue,
          expected_value: expectedValue,
          details: details,
          check_timestamp: checkTimestamp.toISOString(),
          next_check: nextCheck.toISOString(),
          ...generateTimestamps(Math.floor(daysAgo) + 1)
        };

        results.push(result);
      }
    }

    // Insert in smaller batches to avoid parameter limits
    const batchSize = 500; // Insert 500 records at a time
    let totalInserted = 0;
    
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      const batchResult = await this.db.insertBatch('compliance_results', batch, 'DO NOTHING');
      totalInserted += batchResult.length;
    }
    
    const insertResult = { length: totalInserted };
    
    // Generate summary statistics
    const stats = {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      warning: results.filter(r => r.status === 'warning').length,
      notApplicable: results.filter(r => r.status === 'not_applicable').length
    };

    const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
    
    return {
      summary: `Created ${insertResult.length} compliance results - Pass rate: ${passRate}% (${stats.passed}/${stats.total}) - Failed: ${stats.failed}, Warning: ${stats.warning}, N/A: ${stats.notApplicable}`
    };
  }

  generateComplianceValues(requirementCode, status) {
    const templates = {
      'CAM_RESOLUTION_5MP': {
        expected: '5MP',
        passed: randomChoice(['5MP', '6MP', '8MP']),
        failed: randomChoice(['2MP', '3MP', '4MP']),
        warning: '4MP'
      },
      'CAM_UPTIME_99': {
        expected: '99.0%',
        passed: `${randomDecimal(99.0, 99.9)}%`,
        failed: `${randomDecimal(85.0, 98.9)}%`,
        warning: `${randomDecimal(98.0, 98.9)}%`
      },
      'NVR_FIRMWARE_LATEST': {
        expected: 'v4.2.1+',
        passed: randomChoice(['v4.2.1', 'v4.2.2', 'v4.3.0']),
        failed: randomChoice(['v4.1.8', 'v4.0.5', 'v3.9.2']),
        warning: 'v4.2.0'
      },
      'NVR_STORAGE_16TB': {
        expected: '16TB+',
        passed: randomChoice(['16TB', '24TB', '32TB']),
        failed: randomChoice(['2TB', '4TB', '8TB']),
        warning: '12TB'
      },
      'STORAGE_USAGE_80': {
        expected: '<80%',
        passed: `${randomInt(30, 79)}%`,
        failed: `${randomInt(80, 95)}%`,
        warning: `${randomInt(75, 85)}%`
      },
      'SEC_STRONG_PASSWORDS': {
        expected: 'compliant',
        passed: 'strong password policy active',
        failed: 'default/weak passwords detected',
        warning: 'password policy partially compliant'
      }
    };

    const template = templates[requirementCode];
    let actualValue, expectedValue, details;

    if (template) {
      expectedValue = template.expected;
      if (status === 'passed') {
        actualValue = template.passed;
        details = 'Compliance check passed successfully';
      } else if (status === 'failed') {
        actualValue = template.failed;
        details = 'Compliance requirement not met';
      } else if (status === 'warning') {
        actualValue = template.warning;
        details = 'Partial compliance - improvement recommended';
      } else {
        actualValue = 'N/A';
        details = 'Requirement not applicable to this device';
      }
    } else {
      // Generic values for unknown requirements
      expectedValue = 'compliant';
      actualValue = status === 'passed' ? 'compliant' : 
                   status === 'failed' ? 'non-compliant' : 
                   status === 'warning' ? 'partially compliant' : 'N/A';
      details = `Compliance status: ${status}`;
    }

    return { actualValue, expectedValue, details };
  }
}

module.exports = ComplianceResultsSeeder;
