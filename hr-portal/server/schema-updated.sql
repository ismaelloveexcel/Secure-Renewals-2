-- ============================================
-- SCHEMA UPDATES - Entity & Recruiter Management
-- ============================================

-- Add entity field to RRF table
ALTER TABLE recruitment_requests
ADD COLUMN IF NOT EXISTS entity VARCHAR(100) DEFAULT 'Baynunah';

-- Add JD management fields
ALTER TABLE recruitment_requests
ADD COLUMN IF NOT EXISTS jd_status VARCHAR(50) DEFAULT 'Missing',
ADD COLUMN IF NOT EXISTS jd_file_path TEXT,
ADD COLUMN IF NOT EXISTS rrf_file_path TEXT,
ADD COLUMN IF NOT EXISTS auto_filled_jd TEXT;

-- ============================================
-- NEW TABLE: candidate_pool (LinkedIn Form Submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS candidate_pool (
  id SERIAL PRIMARY KEY,
  candidate_id VARCHAR(50) UNIQUE NOT NULL,

  -- Basic Info (from form)
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  nationality VARCHAR(100),
  current_location VARCHAR(100),

  -- CV & Documents
  cv_file_path TEXT,
  cv_text TEXT, -- Extracted text for search
  linkedin_profile VARCHAR(300),

  -- Preferences (from form)
  preferred_functions TEXT[], -- Array: HR, Finance, IT
  years_experience INTEGER,
  expected_salary VARCHAR(100),
  notice_period VARCHAR(100),
  visa_status VARCHAR(100),

  -- Parsed Data (from CV - no "AI" mentions)
  parsed_summary TEXT, -- Auto-generated summary
  parsed_skills JSONB, -- Extracted skills
  parsed_work_history JSONB, -- Work history
  parsed_education JSONB, -- Education
  profile_tags TEXT[], -- Tags: "HR Professional", "Finance Expert"

  -- Matching & Status
  match_score INTEGER, -- 0-100 match score for searches
  last_contacted_date DATE,
  status VARCHAR(50) DEFAULT 'Active', -- Active, Contacted, Hired, Not Interested
  notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pool_email ON candidate_pool(email);
CREATE INDEX idx_pool_functions ON candidate_pool USING GIN(preferred_functions);
CREATE INDEX idx_pool_tags ON candidate_pool USING GIN(profile_tags);
CREATE INDEX idx_pool_status ON candidate_pool(status);

-- ============================================
-- NEW TABLE: external_recruiters (Agency & Freelance)
-- ============================================
CREATE TABLE IF NOT EXISTS external_recruiters (
  id SERIAL PRIMARY KEY,
  recruiter_id VARCHAR(50) UNIQUE NOT NULL,

  -- Account Details
  company_name VARCHAR(200),
  contact_person VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash TEXT NOT NULL,

  -- Type & Permissions
  recruiter_type VARCHAR(50), -- 'Agency', 'Freelance'
  allowed_entities TEXT[], -- ['Baynunah', 'Company B']

  -- Performance Tracking
  total_submissions INTEGER DEFAULT 0,
  successful_placements INTEGER DEFAULT 0,
  last_submission_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'Active', -- Active, Suspended, Inactive
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recruiters_email ON external_recruiters(email);
CREATE INDEX idx_recruiters_status ON external_recruiters(status);

-- ============================================
-- UPDATE: external_submissions (link to recruiter)
-- ============================================
ALTER TABLE external_submissions
ADD COLUMN IF NOT EXISTS recruiter_id VARCHAR(50) REFERENCES external_recruiters(recruiter_id);

-- ============================================
-- NEW TABLE: email_templates (for automation)
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,
  subject VARCHAR(300) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB, -- Available variables: {{candidate_name}}, {{position}}, etc.
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default email templates
INSERT INTO email_templates (template_name, subject, body_html, body_text, variables) VALUES
(
  'candidate_pool_confirmation',
  'Application Received - Baynunah Group',
  '<p>Dear {{candidate_name}},</p><p>Thank you for submitting your CV to Baynunah Group.</p><p>We have received your application and added your profile to our talent pool. Our recruitment team will review your qualifications and contact you when suitable opportunities arise.</p><p>Best regards,<br>HR Team<br>Baynunah Group</p>',
  'Dear {{candidate_name}}, Thank you for submitting your CV to Baynunah Group. We have received your application and added your profile to our talent pool. Our recruitment team will review your qualifications and contact you when suitable opportunities arise. Best regards, HR Team, Baynunah Group',
  '{"candidate_name": "string"}'
),
(
  'interview_invitation',
  'Interview Invitation - {{position}} - Baynunah Group',
  '<p>Dear {{candidate_name}},</p><p>We are pleased to invite you for an interview for the <strong>{{position}}</strong> role.</p><p><strong>Interview Details:</strong><br>Date: {{interview_date}}<br>Time: {{interview_time}}<br>Location: {{interview_location}}<br>Duration: {{duration}}<br>Interviewer: {{interviewer_name}}</p><p>Please confirm your availability by replying to this email.</p><p>Best regards,<br>HR Team<br>Baynunah Group</p>',
  'Dear {{candidate_name}}, We are pleased to invite you for an interview for the {{position}} role. Interview Details: Date: {{interview_date}}, Time: {{interview_time}}, Location: {{interview_location}}, Duration: {{duration}}, Interviewer: {{interviewer_name}}. Please confirm your availability. Best regards, HR Team, Baynunah Group',
  '{"candidate_name": "string", "position": "string", "interview_date": "date", "interview_time": "time", "interview_location": "string", "duration": "string", "interviewer_name": "string"}'
),
(
  'application_rejection',
  'Application Update - Baynunah Group',
  '<p>Dear {{candidate_name}},</p><p>Thank you for your interest in the <strong>{{position}}</strong> role at Baynunah Group.</p><p>After careful review, we have decided to move forward with other candidates whose experience more closely aligns with our current requirements.</p><p>We appreciate your interest in joining our team and wish you all the best in your job search.</p><p>Best regards,<br>HR Team<br>Baynunah Group</p>',
  'Dear {{candidate_name}}, Thank you for your interest in the {{position}} role at Baynunah Group. After careful review, we have decided to move forward with other candidates whose experience more closely aligns with our current requirements. We appreciate your interest and wish you all the best. Best regards, HR Team, Baynunah Group',
  '{"candidate_name": "string", "position": "string"}'
);

-- ============================================
-- NEW TABLE: candidate_matches (search results cache)
-- ============================================
CREATE TABLE IF NOT EXISTS candidate_matches (
  id SERIAL PRIMARY KEY,
  rrf_id INTEGER REFERENCES recruitment_requests(id),
  candidate_pool_id INTEGER REFERENCES candidate_pool(id),
  match_score INTEGER, -- 0-100
  match_reasons JSONB, -- Why matched: skills, experience, location
  status VARCHAR(50) DEFAULT 'Suggested', -- Suggested, Contacted, Rejected, Added to Pipeline
  contacted_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_rrf ON candidate_matches(rrf_id);
CREATE INDEX idx_matches_score ON candidate_matches(match_score DESC);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidate_pool_updated_at BEFORE UPDATE ON candidate_pool
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_recruiters_updated_at BEFORE UPDATE ON external_recruiters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Schema Updated Successfully';
  RAISE NOTICE '📊 New Tables: candidate_pool, external_recruiters, email_templates, candidate_matches';
  RAISE NOTICE '🔧 Updated: recruitment_requests (entity field added)';
  RAISE NOTICE '📧 Email Templates: 3 default templates seeded';
END $$;
