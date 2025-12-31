const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const crypto = require('crypto');
const QRCode = require('qrcode');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/baynunah_hr'
});

// ============================================
// GENERATE HIRING MANAGER PASS
// ============================================
router.post('/generate/hiring-manager', async (req, res) => {
  try {
    const { rrfId, managerName, managerEmail, managerPhone, department } = req.body;

    // Get RRF details
    const rrfResult = await pool.query(
      'SELECT * FROM recruitment_requests WHERE id = $1',
      [rrfId]
    );

    if (rrfResult.rows.length === 0) {
      return res.status(404).json({ error: 'RRF not found' });
    }

    const rrf = rrfResult.rows[0];

    // Generate unique pass ID
    const date = new Date();
    const year = date.getFullYear();

    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM passes
      WHERE type = 'hiring_manager' AND EXTRACT(YEAR FROM created_at) = $1
    `, [year]);

    const sequential = String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0');
    const passId = `HM-${year}-${sequential}`;

    // Generate secure access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Generate QR code
    const passUrl = `${process.env.APP_URL || 'http://localhost:5000'}/pass/${passId}?token=${accessToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(passUrl);

    // Enabled modules for hiring manager
    const enabledModules = [
      'view_candidates',      // View shortlisted candidates
      'schedule_interviews',  // Schedule interviews
      'submit_feedback',      // Submit interview feedback
      'make_decision',        // Accept/Reject candidates
      'view_pipeline',        // View recruitment pipeline
      'request_candidates'    // Request more candidates from HR
    ];

    // Store pass data
    const passData = {
      passId,
      accessToken,
      managerName,
      managerEmail,
      managerPhone,
      department,
      rrfId,
      rrfNumber: rrf.rrf_number,
      jobTitle: rrf.job_title,
      entity: rrf.entity,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      qrCode: qrCodeDataUrl,
      status: 'Active'
    };

    // Insert into passes table
    await pool.query(`
      INSERT INTO passes (id, type, enabled_modules, data, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [
      passId,
      'hiring_manager',
      JSON.stringify(enabledModules),
      JSON.stringify(passData)
    ]);

    // TODO: Send email with pass link

    res.json({
      success: true,
      pass: {
        passId,
        accessUrl: passUrl,
        qrCode: qrCodeDataUrl,
        expiresAt: passData.expiresAt
      }
    });
  } catch (error) {
    console.error('Error generating hiring manager pass:', error);
    res.status(500).json({ error: 'Failed to generate hiring manager pass' });
  }
});

// ============================================
// GENERATE CANDIDATE PASS
// ============================================
router.post('/generate/candidate', async (req, res) => {
  try {
    const { candidateId, candidateName, candidateEmail, candidatePhone, rrfId, position } = req.body;

    // Generate unique pass ID
    const date = new Date();
    const year = date.getFullYear();

    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM passes
      WHERE type = 'candidate' AND EXTRACT(YEAR FROM created_at) = $1
    `, [year]);

    const sequential = String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0');
    const passId = `CAND-${year}-${sequential}`;

    // Generate secure access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Generate QR code
    const passUrl = `${process.env.APP_URL || 'http://localhost:5000'}/pass/${passId}?token=${accessToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(passUrl);

    // Enabled modules for candidate
    const enabledModules = [
      'view_application_status',  // Track application progress
      'view_interview_schedule',  // View interview dates
      'upload_documents',         // Upload required documents
      'view_job_details',         // View job description
      'submit_questions',         // Ask HR questions
      'accept_reject_offer'       // Accept/reject job offer
    ];

    // Store pass data
    const passData = {
      passId,
      accessToken,
      candidateId,
      candidateName,
      candidateEmail,
      candidatePhone,
      rrfId,
      position,
      currentStage: 1, // Application
      stageHistory: [
        {
          stage: 1,
          stageName: 'Application Submitted',
          date: new Date(),
          status: 'Completed'
        }
      ],
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      qrCode: qrCodeDataUrl,
      status: 'Active'
    };

    // Insert into passes table
    await pool.query(`
      INSERT INTO passes (id, type, enabled_modules, data, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [
      passId,
      'candidate',
      JSON.stringify(enabledModules),
      JSON.stringify(passData)
    ]);

    // TODO: Send email with pass link

    res.json({
      success: true,
      pass: {
        passId,
        accessUrl: passUrl,
        qrCode: qrCodeDataUrl,
        expiresAt: passData.expiresAt
      }
    });
  } catch (error) {
    console.error('Error generating candidate pass:', error);
    res.status(500).json({ error: 'Failed to generate candidate pass' });
  }
});

// ============================================
// GENERATE EMPLOYEE PASS
// ============================================
router.post('/generate/employee', async (req, res) => {
  try {
    const { employeeId, fullName, email, phone, department, jobTitle, lineManager } = req.body;

    // Generate unique pass ID
    const passId = employeeId; // Use employee ID as pass ID

    // Generate secure access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Generate QR code
    const passUrl = `${process.env.APP_URL || 'http://localhost:5000'}/pass/${passId}?token=${accessToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(passUrl);

    // Enabled modules for employee
    const enabledModules = [
      'attendance',           // Clock in/out
      'leave_requests',       // Request leave
      'view_payslip',        // View payslips
      'update_profile',      // Update personal info
      'view_policies',       // View HR policies
      'submit_requests',     // Submit HR requests (parking, documents, etc.)
      'view_benefits',       // View benefits
      'view_team',           // View team members
      'expense_claims'       // Submit expense claims
    ];

    // Store pass data
    const passData = {
      passId,
      accessToken,
      employeeId,
      fullName,
      email,
      phone,
      department,
      jobTitle,
      lineManager,
      joinDate: new Date(),
      expiresAt: null, // Employee passes don't expire
      qrCode: qrCodeDataUrl,
      status: 'Active'
    };

    // Insert into passes table
    await pool.query(`
      INSERT INTO passes (id, type, enabled_modules, data, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        enabled_modules = $3,
        data = $4,
        updated_at = CURRENT_TIMESTAMP
    `, [
      passId,
      'employee',
      JSON.stringify(enabledModules),
      JSON.stringify(passData)
    ]);

    // TODO: Send email with pass link

    res.json({
      success: true,
      pass: {
        passId,
        accessUrl: passUrl,
        qrCode: qrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Error generating employee pass:', error);
    res.status(500).json({ error: 'Failed to generate employee pass' });
  }
});

// ============================================
// GENERATE MANAGER PASS (3-in-1)
// ============================================
router.post('/generate/manager', async (req, res) => {
  try {
    const { employeeId, fullName, email, phone, department, jobTitle, teamSize } = req.body;

    // Generate unique pass ID
    const passId = `MGR-${employeeId}`;

    // Generate secure access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Generate QR code
    const passUrl = `${process.env.APP_URL || 'http://localhost:5000'}/pass/${passId}?token=${accessToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(passUrl);

    // Enabled modules for manager (3-in-1: Personal + Team + Recruitment)
    const enabledModules = [
      // Personal (Employee modules)
      'attendance',
      'leave_requests',
      'view_payslip',
      'update_profile',
      'view_policies',
      'submit_requests',
      'view_benefits',
      'expense_claims',

      // Team Management
      'view_team',
      'approve_leave',
      'view_team_attendance',
      'performance_reviews',
      'team_announcements',
      'approve_expenses',
      'team_calendar',

      // Recruitment (Hiring Manager)
      'view_candidates',
      'schedule_interviews',
      'submit_feedback',
      'make_decision',
      'view_pipeline',
      'request_candidates'
    ];

    // Store pass data
    const passData = {
      passId,
      accessToken,
      employeeId,
      fullName,
      email,
      phone,
      department,
      jobTitle,
      teamSize,
      joinDate: new Date(),
      expiresAt: null, // Manager passes don't expire
      qrCode: qrCodeDataUrl,
      status: 'Active'
    };

    // Insert into passes table
    await pool.query(`
      INSERT INTO passes (id, type, enabled_modules, data, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        enabled_modules = $3,
        data = $4,
        updated_at = CURRENT_TIMESTAMP
    `, [
      passId,
      'manager',
      JSON.stringify(enabledModules),
      JSON.stringify(passData)
    ]);

    // TODO: Send email with pass link

    res.json({
      success: true,
      pass: {
        passId,
        accessUrl: passUrl,
        qrCode: qrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Error generating manager pass:', error);
    res.status(500).json({ error: 'Failed to generate manager pass' });
  }
});

// ============================================
// VALIDATE PASS & GET DATA
// ============================================
router.get('/validate/:passId', async (req, res) => {
  try {
    const { passId } = req.params;
    const { token } = req.query;

    const result = await pool.query(
      'SELECT * FROM passes WHERE id = $1',
      [passId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pass not found' });
    }

    const pass = result.rows[0];
    const passData = pass.data;

    // Validate access token
    if (passData.accessToken !== token) {
      return res.status(403).json({ error: 'Invalid access token' });
    }

    // Check if pass is expired
    if (passData.expiresAt && new Date(passData.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'Pass has expired' });
    }

    // Check if pass is active
    if (passData.status !== 'Active') {
      return res.status(403).json({ error: 'Pass is not active' });
    }

    res.json({
      success: true,
      pass: {
        passId: pass.id,
        type: pass.type,
        enabledModules: pass.enabled_modules,
        data: passData
      }
    });
  } catch (error) {
    console.error('Error validating pass:', error);
    res.status(500).json({ error: 'Failed to validate pass' });
  }
});

// ============================================
// LIST ALL PASSES (For HR)
// ============================================
router.get('/list', async (req, res) => {
  try {
    const { type, status } = req.query;

    let query = 'SELECT * FROM passes WHERE 1=1';
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND data->>'status' = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      passes: result.rows.map(pass => ({
        passId: pass.id,
        type: pass.type,
        createdAt: pass.created_at,
        data: pass.data
      }))
    });
  } catch (error) {
    console.error('Error listing passes:', error);
    res.status(500).json({ error: 'Failed to list passes' });
  }
});

// ============================================
// REVOKE PASS
// ============================================
router.post('/revoke/:passId', async (req, res) => {
  try {
    const { passId } = req.params;

    const result = await pool.query(
      `UPDATE passes
       SET data = jsonb_set(data, '{status}', '"Revoked"'),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [passId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pass not found' });
    }

    res.json({
      success: true,
      message: 'Pass revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking pass:', error);
    res.status(500).json({ error: 'Failed to revoke pass' });
  }
});

module.exports = router;
