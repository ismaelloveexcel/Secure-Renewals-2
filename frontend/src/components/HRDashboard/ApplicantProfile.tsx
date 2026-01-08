/**
 * Applicant Profile Component
 * 
 * LOCKED DESIGN DECISION - DATA SOURCE OWNERSHIP:
 * 
 * A. AUTO-EXTRACTED FROM CV (System-controlled, read-only by default)
 *    - Full Name, Email, Phone
 *    - Current Job Title, Current Company
 *    - Employment History (company + role + dates)
 *    - Total Years of Experience
 *    - Education (degree, institution)
 *    - Core Skills (parsed keywords)
 *    - Certifications (if listed)
 *    Editable only via HR override, never directly by candidate.
 * 
 * B. CANDIDATE-FILLED (Form-driven, mandatory)
 *    - Preferred Name, Nationality, Current Location
 *    - Right to Work Status, Notice Period
 *    - Availability to Join, Willingness to Relocate
 *    - Work Mode Preference, Salary Expectation
 *    - Current Salary (optional)
 * 
 * C. INTERNAL ONLY (HR/Manager - hidden from candidate)
 *    - Source (Agency/Referral/Direct)
 *    - Recruiter Assigned
 *    - Internal Fit Indicator
 *    - Risk Flags (Visa, Gap, Job Hopping)
 *    - Assessment logic, Scores, Decision rationale
 *    - Offer readiness
 */

import React, { useState } from 'react'

// CV-Extracted Data (System-controlled)
interface CVExtractedData {
  full_name: string
  email: string
  phone?: string
  current_job_title?: string
  current_company?: string
  employment_history?: Array<{
    company: string
    role: string
    start_date: string
    end_date?: string
  }>
  years_experience?: number
  education?: Array<{
    degree: string
    institution: string
    year?: number
  }>
  core_skills?: string[]
  certifications?: string[]
}

// Candidate-Filled Data (Form-driven)
interface CandidateFilledData {
  preferred_name?: string
  nationality?: string
  current_location?: string
  right_to_work_status?: string
  notice_period?: string
  availability_to_join?: string
  willingness_to_relocate?: boolean
  work_mode_preference?: 'office' | 'remote' | 'hybrid'
  salary_expectation_min?: number
  salary_expectation_max?: number
  current_salary?: number
  salary_currency?: string
}

// Internal Data (HR/Manager only)
interface InternalData {
  source?: string
  source_details?: string
  recruiter_assigned?: string
  internal_fit_indicator?: 'strong' | 'moderate' | 'weak' | 'pending'
  risk_flags?: string[]
  assessment_required?: boolean
  assessment_type?: 'technical' | 'soft_skill' | 'combined'
  assessment_rationale?: string
  assessment_status?: string
  assessment_score?: number
  assessment_result?: 'pass' | 'fail'
  interview_recommendation?: string
  seniority_validation?: string
  offer_readiness?: 'ready' | 'pending' | 'not_ready'
  exception_notes?: string
}

interface ApplicantProfileProps {
  candidateId: number
  cvData: CVExtractedData
  candidateData: CandidateFilledData
  internalData: InternalData
  viewMode: 'hr' | 'manager' | 'candidate'
  assessmentCompleted?: boolean
  token: string
  onUpdate?: (data: Partial<CandidateFilledData | InternalData>) => void
  onClose?: () => void
}

// HR-controlled fields that candidate can request edits to
const CV_FIELDS_LABELS: Record<keyof CVExtractedData, string> = {
  full_name: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  current_job_title: 'Current Job Title',
  current_company: 'Current Company',
  employment_history: 'Employment History',
  years_experience: 'Years of Experience',
  education: 'Education',
  core_skills: 'Core Skills',
  certifications: 'Certifications'
}

export function ApplicantProfile({
  candidateId,
  cvData,
  candidateData,
  internalData,
  viewMode,
  assessmentCompleted = false,
  token,
  onUpdate,
  onClose
}: ApplicantProfileProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'assessment'>('profile')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<CandidateFilledData>(candidateData)
  const [internalFormData, setInternalFormData] = useState<InternalData>(internalData)

  const isHRorManager = viewMode === 'hr' || viewMode === 'manager'
  const isHR = viewMode === 'hr'
  const isCandidate = viewMode === 'candidate'

  const handleFieldChange = (field: keyof CandidateFilledData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInternalFieldChange = (field: keyof InternalData, value: unknown) => {
    setInternalFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (isCandidate) {
      onUpdate?.(formData)
    } else {
      onUpdate?.({ ...formData, ...internalFormData })
    }
    setEditMode(false)
  }

  const renderCVSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Profile Information</h3>
        <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
          Auto-extracted from CV
        </span>
      </div>

      {/* Identity */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Full Name</p>
            <p className="text-sm font-medium text-slate-800">{cvData.full_name}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Email</p>
            <p className="text-sm text-slate-700">{cvData.email}</p>
          </div>
          {cvData.phone && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Phone</p>
              <p className="text-sm text-slate-700">{cvData.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Professional */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Professional</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400">Current Title</p>
            <p className="text-sm font-medium text-slate-800">{cvData.current_job_title || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Current Company</p>
            <p className="text-sm text-slate-700">{cvData.current_company || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Experience</p>
            <p className="text-sm text-slate-700">{cvData.years_experience || 0} years</p>
          </div>
        </div>

        {/* Employment History */}
        {cvData.employment_history && cvData.employment_history.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 mb-2">Employment History</p>
            <div className="space-y-2">
              {cvData.employment_history.slice(0, 3).map((job, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-medium text-slate-700">{job.role}</p>
                  <p className="text-slate-500">{job.company} • {job.start_date} - {job.end_date || 'Present'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {cvData.education && cvData.education.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 mb-2">Education</p>
            <div className="space-y-1">
              {cvData.education.map((edu, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-medium text-slate-700">{edu.degree}</p>
                  <p className="text-slate-500">{edu.institution} {edu.year && `(${edu.year})`}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {cvData.core_skills && cvData.core_skills.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 mb-2">Core Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {cvData.core_skills.slice(0, 10).map((skill, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                  {skill}
                </span>
              ))}
              {cvData.core_skills.length > 10 && (
                <span className="text-[10px] text-slate-400">+{cvData.core_skills.length - 10} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {isCandidate && (
        <p className="text-[10px] text-slate-400 italic">
          To request changes to CV-extracted information, please contact HR.
        </p>
      )}
    </div>
  )

  const renderCandidateFilledSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Your Details</h3>
        {isCandidate && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="text-xs text-purple-600 hover:text-purple-800"
          >
            Edit
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        {/* Personal Identifiers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Preferred Name</label>
            {editMode ? (
              <input
                type="text"
                value={formData.preferred_name || ''}
                onChange={(e) => handleFieldChange('preferred_name', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            ) : (
              <p className="text-sm text-slate-700">{formData.preferred_name || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Nationality</label>
            {editMode ? (
              <input
                type="text"
                value={formData.nationality || ''}
                onChange={(e) => handleFieldChange('nationality', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            ) : (
              <p className="text-sm text-slate-700">{formData.nationality || 'Not provided'}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Current Location</label>
            {editMode ? (
              <input
                type="text"
                value={formData.current_location || ''}
                onChange={(e) => handleFieldChange('current_location', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            ) : (
              <p className="text-sm text-slate-700">{formData.current_location || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Right to Work</label>
            {editMode ? (
              <select
                value={formData.right_to_work_status || ''}
                onChange={(e) => handleFieldChange('right_to_work_status', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Select...</option>
                <option value="citizen">UAE Citizen</option>
                <option value="resident">Residence Visa</option>
                <option value="work_permit">Work Permit</option>
                <option value="requires_sponsorship">Requires Sponsorship</option>
              </select>
            ) : (
              <p className="text-sm text-slate-700">{formData.right_to_work_status || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Availability */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Notice Period</label>
            {editMode ? (
              <select
                value={formData.notice_period || ''}
                onChange={(e) => handleFieldChange('notice_period', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Select...</option>
                <option value="immediate">Immediate</option>
                <option value="1_week">1 Week</option>
                <option value="2_weeks">2 Weeks</option>
                <option value="1_month">1 Month</option>
                <option value="2_months">2 Months</option>
                <option value="3_months">3 Months</option>
              </select>
            ) : (
              <p className="text-sm text-slate-700">{formData.notice_period || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Available to Join</label>
            {editMode ? (
              <input
                type="date"
                value={formData.availability_to_join || ''}
                onChange={(e) => handleFieldChange('availability_to_join', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            ) : (
              <p className="text-sm text-slate-700">{formData.availability_to_join || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Relocate?</label>
            {editMode ? (
              <select
                value={formData.willingness_to_relocate ? 'yes' : 'no'}
                onChange={(e) => handleFieldChange('willingness_to_relocate', e.target.value === 'yes')}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            ) : (
              <p className="text-sm text-slate-700">{formData.willingness_to_relocate ? 'Yes' : 'No'}</p>
            )}
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Work Mode</label>
            {editMode ? (
              <select
                value={formData.work_mode_preference || ''}
                onChange={(e) => handleFieldChange('work_mode_preference', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Select...</option>
                <option value="office">Office</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            ) : (
              <p className="text-sm text-slate-700 capitalize">{formData.work_mode_preference || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Compensation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Salary Expectation (AED)</label>
            {editMode ? (
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={formData.salary_expectation_min || ''}
                  onChange={(e) => handleFieldChange('salary_expectation_min', parseInt(e.target.value) || undefined)}
                  className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={formData.salary_expectation_max || ''}
                  onChange={(e) => handleFieldChange('salary_expectation_max', parseInt(e.target.value) || undefined)}
                  className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-700">
                {formData.salary_expectation_min && formData.salary_expectation_max
                  ? `${formData.salary_expectation_min.toLocaleString()} - ${formData.salary_expectation_max.toLocaleString()} AED`
                  : 'Not provided'}
              </p>
            )}
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Current Salary (Optional)</label>
            {editMode ? (
              <input
                type="number"
                value={formData.current_salary || ''}
                onChange={(e) => handleFieldChange('current_salary', parseInt(e.target.value) || undefined)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            ) : (
              <p className="text-sm text-slate-700">
                {formData.current_salary ? `${formData.current_salary.toLocaleString()} AED` : 'Not disclosed'}
              </p>
            )}
          </div>
        </div>

        {editMode && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setEditMode(false)}
              className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderInternalSection = () => {
    if (!isHRorManager) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Internal Information</h3>
          <span className="text-[9px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
            HR/Manager Only
          </span>
        </div>

        <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-4">
          {/* Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider">Source</label>
              <p className="text-sm text-slate-700">{internalFormData.source || 'Direct'}</p>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider">Recruiter Assigned</label>
              <p className="text-sm text-slate-700">{internalFormData.recruiter_assigned || 'Not assigned'}</p>
            </div>
          </div>

          {/* Fit & Risk */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider">Internal Fit</label>
              <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-medium ${
                internalFormData.internal_fit_indicator === 'strong' ? 'bg-emerald-100 text-emerald-700' :
                internalFormData.internal_fit_indicator === 'moderate' ? 'bg-amber-100 text-amber-700' :
                internalFormData.internal_fit_indicator === 'weak' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {internalFormData.internal_fit_indicator || 'Pending'}
              </span>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider">Risk Flags</label>
              {internalFormData.risk_flags && internalFormData.risk_flags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {internalFormData.risk_flags.map((flag, idx) => (
                    <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                      {flag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">None</p>
              )}
            </div>
          </div>

          {/* Pre-Assessment Decision Block */}
          {!assessmentCompleted && (
            <div className="pt-3 border-t border-red-200">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
                Pre-Assessment Decision
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400">Assessment Required?</label>
                  {isHR ? (
                    <select
                      value={internalFormData.assessment_required ? 'yes' : 'no'}
                      onChange={(e) => handleInternalFieldChange('assessment_required', e.target.value === 'yes')}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-700">{internalFormData.assessment_required ? 'Yes' : 'No'}</p>
                  )}
                </div>
                {internalFormData.assessment_required && (
                  <div>
                    <label className="text-[10px] text-slate-400">Assessment Type</label>
                    {isHR ? (
                      <select
                        value={internalFormData.assessment_type || ''}
                        onChange={(e) => handleInternalFieldChange('assessment_type', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="technical">Technical (Manager)</option>
                        <option value="soft_skill">Soft Skill (HR)</option>
                        <option value="combined">Combined (Both)</option>
                      </select>
                    ) : (
                      <p className="text-sm text-slate-700 capitalize">{internalFormData.assessment_type || 'Not set'}</p>
                    )}
                  </div>
                )}
              </div>
              {internalFormData.assessment_required && isHR && (
                <div className="mt-3">
                  <label className="text-[10px] text-slate-400">Assessment Rationale</label>
                  <textarea
                    value={internalFormData.assessment_rationale || ''}
                    onChange={(e) => handleInternalFieldChange('assessment_rationale', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    rows={2}
                    placeholder="Why is this assessment needed?"
                  />
                </div>
              )}
            </div>
          )}

          {/* Post-Assessment Section */}
          {assessmentCompleted && (
            <div className="pt-3 border-t border-red-200">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
                Assessment Results
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400">Status</label>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-medium ${
                    internalFormData.assessment_result === 'pass' ? 'bg-emerald-100 text-emerald-700' :
                    internalFormData.assessment_result === 'fail' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {internalFormData.assessment_result === 'pass' ? 'Passed' :
                     internalFormData.assessment_result === 'fail' ? 'Failed' : 'Under Review'}
                  </span>
                </div>
                {internalFormData.assessment_score !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">Score</label>
                    <p className="text-sm font-bold text-slate-800">{internalFormData.assessment_score}%</p>
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400">Interview Recommendation</label>
                  {isHR ? (
                    <select
                      value={internalFormData.interview_recommendation || ''}
                      onChange={(e) => handleInternalFieldChange('interview_recommendation', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="proceed">Proceed to Interview</option>
                      <option value="hold">Hold</option>
                      <option value="reject">Reject</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-700">{internalFormData.interview_recommendation || 'Pending'}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Offer Readiness</label>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-medium ${
                    internalFormData.offer_readiness === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                    internalFormData.offer_readiness === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {internalFormData.offer_readiness || 'Not Ready'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isHR && (
            <div className="pt-3">
              <button
                onClick={handleSave}
                className="w-full py-2 bg-purple-600 text-white text-xs font-medium rounded-lg"
              >
                Save Internal Notes
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderCandidateAssessmentView = () => {
    if (!isCandidate || !assessmentCompleted) return null

    // Candidate sees ONLY: Assessment Completed, Outcome: Passed / Under Review / Not Successful
    // No scores. No comments.
    return (
      <div className="bg-slate-50 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Assessment Status</h3>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            internalData.assessment_result === 'pass' ? 'bg-emerald-100' :
            internalData.assessment_result === 'fail' ? 'bg-red-100' :
            'bg-amber-100'
          }`}>
            {internalData.assessment_result === 'pass' ? (
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : internalData.assessment_result === 'fail' ? (
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Assessment Completed</p>
            <p className="text-xs text-slate-500">
              Outcome: {
                internalData.assessment_result === 'pass' ? 'Passed' :
                internalData.assessment_result === 'fail' ? 'Not Successful' :
                'Under Review'
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{cvData.full_name}</h2>
            <p className="text-xs text-slate-500">
              {cvData.current_job_title} {cvData.current_company && `at ${cvData.current_company}`}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveSection('profile')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeSection === 'profile' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Profile
          </button>
          {assessmentCompleted && (
            <button
              onClick={() => setActiveSection('assessment')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'assessment' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Assessment
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-6">
        {activeSection === 'profile' && (
          <>
            {renderCVSection()}
            {renderCandidateFilledSection()}
            {renderInternalSection()}
          </>
        )}
        {activeSection === 'assessment' && (
          <>
            {isCandidate && renderCandidateAssessmentView()}
            {isHRorManager && renderInternalSection()}
          </>
        )}
      </div>
    </div>
  )
}
