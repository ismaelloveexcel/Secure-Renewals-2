const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/baynunah_hr'
});

// ============================================
// DASHBOARD STATS
// ============================================
router.get('/dashboard-stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM recruitment_requests WHERE status = 'Approved') as active_rrfs,
        (SELECT COUNT(*) FROM candidate_pool WHERE status = 'Active') as candidate_pool,
        (SELECT COUNT(*) FROM external_submissions WHERE status = 'Pending Review') as pending_submissions,
        (SELECT COUNT(*) FROM candidates WHERE current_stage = 4) as interviews_scheduled
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ============================================
// GET ACTIVE RRFs
// ============================================
router.get('/rrf/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.*,
        COUNT(c.id) as candidates_count
      FROM recruitment_requests r
      LEFT JOIN candidates c ON r.id = c.rrf_id
      WHERE r.status IN ('Approved', 'Pending')
      GROUP BY r.id
      ORDER BY r.request_date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active RRFs:', error);
    res.status(500).json({ error: 'Failed to fetch RRFs' });
  }
});

// ============================================
// CREATE NEW RRF
// ============================================
router.post('/rrf/create', async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);

    // Generate RRF number: RRF-BWT-{month}-{sequential}
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Get next sequential number for this month
    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM recruitment_requests
      WHERE EXTRACT(MONTH FROM request_date) = $1
        AND EXTRACT(YEAR FROM request_date) = $2
    `, [date.getMonth() + 1, date.getFullYear()]);

    const sequential = String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0');
    const rrfNumber = `RRF-BWT-${month}-${sequential}`;

    // Insert RRF
    const result = await pool.query(`
      INSERT INTO recruitment_requests (
        rrf_number,
        entity,
        department,
        job_title,
        reason_for_hiring,
        replacing_whom,
        job_description,
        required_skills,
        salary_range,
        location,
        hiring_urgency,
        status,
        jd_status,
        hr_approved,
        ceo_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Approved', $12, true, true)
      RETURNING *
    `, [
      rrfNumber,
      data.entity,
      data.department,
      data.jobTitle,
      data.reasonForHiring,
      data.replacingWhom || null,
      data.jobDescription,
      data.requiredSkills,
      data.salaryRange,
      data.location,
      data.hiringUrgency,
      data.jdStatus
    ]);

    res.json({
      success: true,
      rrf: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating RRF:', error);
    res.status(500).json({ error: 'Failed to create RRF' });
  }
});

// ============================================
// AUTO-FILL JD (using templates, not AI)
// ============================================
router.post('/rrf/auto-fill-jd', async (req, res) => {
  try {
    const { jobTitle, department } = req.body;

    // Simple template-based approach (NOT AI)
    const templates = {
      'Electronics Engineer': {
        jobDescription: `Design and maintain control electronics for AWG products, develop embedded firmware, and ensure reliable operation of sensors and actuators. Lead testing, validation, and troubleshooting activities.`,
        requiredSkills: 'Circuit design, embedded systems (MCUs), PCB tools (Altium/KiCad), industrial communications (Modbus/RS485), debugging (oscilloscope, logic analyzer)'
      },
      'Thermodynamics Engineer': {
        jobDescription: `Model and optimize refrigeration cycles for dehumidification and water yield. Build simulation models, execute lab testing, and produce technical documentation for compliance.`,
        requiredSkills: 'Refrigeration cycle analysis, psychrometrics, heat transfer, simulation tools (EES/MATLAB/ANSYS), lab testing and instrumentation, technical writing'
      }
    };

    const template = templates[jobTitle] || {
      jobDescription: `Key responsibilities for ${jobTitle} role in ${department} department.`,
      requiredSkills: 'Relevant technical and professional skills required for this role'
    };

    res.json(template);
  } catch (error) {
    console.error('Error auto-filling JD:', error);
    res.status(500).json({ error: 'Failed to auto-fill job description' });
  }
});

// ============================================
// SEED TEST DATA - Add 2 Job Positions
// ============================================
router.post('/rrf/seed-test-positions', async (req, res) => {
  try {
    const positions = [
      {
        rrf_number: 'RRF-BWT-12-001',
        entity: 'Baynunah Watergeneration Technologies SP LLC',
        department: 'Engineering / R&D',
        job_title: 'Electronics Engineer',
        reason_for_hiring: 'Expansion - New Product Development',
        job_description: `Own the design, development, and validation of electronics and embedded control systems for Ma Hawa atmospheric water generation (AWG) machines. The role ensures reliable operation of compressors, fans, defrost/sanitation cycles, sensors, safety interlocks, and connectivity—supporting rapid prototyping, product industrialisation, and field performance in UAE operating conditions.

Principal Accountabilities:
1. Electronics & Control System Design
   - Design and maintain control electronics (schematics, BOM, PCB design reviews) for AWG products across sizes
   - Select components and design interfaces for sensors and actuators
   - Develop embedded firmware / control logic for all operational states
   - Implement communications and data logging
   - Design for DFM/DFT, reliability, and hot/humid/dusty environments

2. Testing, Validation & Troubleshooting
   - Plan and execute board bring-up, debugging, and integration testing
   - Lead root-cause analysis for electronics/control faults
   - Support EMC/safety/pre-compliance activities

3. Documentation & Cross-Functional Delivery
   - Maintain clear engineering documentation
   - Work closely with thermodynamics and mechanical engineering teams`,
        required_skills: 'Circuit design fundamentals, power supply design, sensor interfacing, embedded systems (MCUs), control logic, PCB tools (Altium/KiCad), DFM/DFT, industrial communications (Modbus/RS485/CAN), debugging (oscilloscope, logic analyser), test planning, failure analysis, RCA/8D',
        salary_range: '15,000 - 25,000 AED',
        location: 'Abu Dhabi',
        hiring_urgency: 'High',
        status: 'Approved',
        jd_status: 'Complete',
        hr_approved: true,
        ceo_approved: true
      },
      {
        rrf_number: 'RRF-BWT-12-002',
        entity: 'Baynunah Watergeneration Technologies SP LLC',
        department: 'Engineering / R&D',
        job_title: 'Thermodynamics Engineer',
        reason_for_hiring: 'Expansion - New Product Development',
        job_description: `Own thermodynamic performance for Ma Hawa atmospheric water generation (AWG) products by modelling, optimising, and validating refrigeration/heat-exchange systems for dehumidification and water yield. This role bridges analysis and laboratory validation and produces audit-ready technical documentation.

Principal Accountabilities:
1. Thermodynamic & Refrigeration Cycle Engineering
   - Model and optimise refrigeration cycles for dehumidification / water yield
   - Define performance targets suited to UAE climate conditions
   - Support selection/specification of compressors, heat exchangers, expansion devices, fans, refrigerants

2. Simulation, Prototyping & Validation
   - Build and maintain simulation models (EES/MATLAB/ANSYS)
   - Plan and execute lab testing with proper instrumentation
   - Drive improvements based on test results

3. Technical Documentation
   - Produce technical specifications, performance reports, test reports
   - Create/maintain installation, operation, and troubleshooting guides
   - Provide engineering evidence for compliance/certification

4. Cross-Functional Collaboration
   - Work with electronics and mechanical engineering teams
   - Support field investigations`,
        required_skills: 'Refrigeration cycle analysis, psychrometrics, heat transfer, airflow/pressure-drop fundamentals, simulation and modelling (EES, MATLAB, ANSYS), lab testing and instrumentation, data analysis, technical writing, cost/performance trade-offs',
        salary_range: '15,000 - 25,000 AED',
        location: 'Abu Dhabi',
        hiring_urgency: 'High',
        status: 'Approved',
        jd_status: 'Complete',
        hr_approved: true,
        ceo_approved: true
      }
    ];

    const insertedRRFs = [];

    for (const pos of positions) {
      const result = await pool.query(`
        INSERT INTO recruitment_requests (
          rrf_number,
          entity,
          department,
          job_title,
          reason_for_hiring,
          job_description,
          required_skills,
          salary_range,
          location,
          hiring_urgency,
          status,
          jd_status,
          hr_approved,
          ceo_approved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (rrf_number) DO NOTHING
        RETURNING *
      `, [
        pos.rrf_number,
        pos.entity,
        pos.department,
        pos.job_title,
        pos.reason_for_hiring,
        pos.job_description,
        pos.required_skills,
        pos.salary_range,
        pos.location,
        pos.hiring_urgency,
        pos.status,
        pos.jd_status,
        pos.hr_approved,
        pos.ceo_approved
      ]);

      if (result.rows.length > 0) {
        insertedRRFs.push(result.rows[0]);
      }
    }

    res.json({
      success: true,
      message: `Successfully added ${insertedRRFs.length} job positions`,
      rrfs: insertedRRFs
    });
  } catch (error) {
    console.error('Error seeding test positions:', error);
    res.status(500).json({ error: 'Failed to seed test positions' });
  }
});

// ============================================
// CANDIDATE POOL - PUBLIC FORM SUBMISSION
// ============================================
router.post('/candidate-pool/submit', async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);

    // Generate candidate ID
    const date = new Date();
    const year = date.getFullYear();

    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM candidate_pool
      WHERE EXTRACT(YEAR FROM submitted_at) = $1
    `, [year]);

    const sequential = String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0');
    const candidateId = `CAND-${year}-${sequential}`;

    // Insert into candidate_pool
    const result = await pool.query(`
      INSERT INTO candidate_pool (
        candidate_id,
        full_name,
        email,
        phone,
        nationality,
        current_location,
        linkedin_profile,
        preferred_functions,
        years_experience,
        expected_salary,
        notice_period,
        visa_status,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active')
      RETURNING *
    `, [
      candidateId,
      data.fullName,
      data.email,
      data.phone,
      data.nationality || null,
      data.currentLocation || null,
      data.linkedinProfile || null,
      data.preferredFunctions || [],
      data.yearsExperience || null,
      data.expectedSalary || null,
      data.noticePeriod || null,
      data.visaStatus || null
    ]);

    // TODO: Upload CV file to storage and parse it
    // TODO: Send confirmation email using email_templates

    res.json({
      success: true,
      candidateId: candidateId,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting to candidate pool:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ============================================
// GET CANDIDATE POOL
// ============================================
router.get('/candidate-pool/list', async (req, res) => {
  try {
    const { search, functions } = req.query;

    let query = 'SELECT * FROM candidate_pool WHERE status = $1';
    const params = ['Active'];

    if (search) {
      query += ' AND (full_name ILIKE $2 OR email ILIKE $2 OR cv_text ILIKE $2)';
      params.push(`%${search}%`);
    }

    if (functions) {
      const functionsArray = functions.split(',');
      query += ` AND preferred_functions && $${params.length + 1}`;
      params.push(functionsArray);
    }

    query += ' ORDER BY submitted_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidate pool:', error);
    res.status(500).json({ error: 'Failed to fetch candidate pool' });
  }
});

module.exports = router;
