/**
 * Assessment Configuration Component
 * 
 * LOCKED DESIGN DECISION:
 * - Assessments are NOT stages - they are action-triggered events inside Screening/Interview
 * - They are optional, role-driven, and selectable
 * - They create temporary blocking actions
 * 
 * WHO CAN SELECT WHAT (LOCKED):
 * - Technical Assessment: Triggered by Manager (owns role competence)
 * - Soft Skill Assessment: Triggered by HR (owns culture & behavior)
 * - Combined Assessment: HR + Manager (senior/critical roles)
 * 
 * No candidate self-selection. Ever.
 * 
 * FLOW:
 * 1. Manager selects "Technical Assessment Required" → System triggers assessment
 * 2. HR assigns/reviews assessment → Sends to candidate
 * 3. Candidate completes → Manager (Technical) or HR (Soft) reviews results
 * 4. Pass/Fail decision → Proceed to interview or reject
 */

import React, { useState, useEffect } from 'react'

interface AssessmentConfigProps {
  recruitmentRequestId: number
  candidateId?: number  // If configuring for specific candidate
  positionTitle: string
  jobDescription?: string
  token: string
  entityColor?: string
  viewMode: 'manager' | 'hr'  // WHO is configuring
  currentStage?: 'screening' | 'interview'  // WHERE in the flow
  onConfigSaved?: (config: AssessmentConfigData) => void
  onClose?: () => void
  readonly?: boolean
}

interface AssessmentConfigData {
  // Type and Trigger
  assessment_type: 'technical' | 'soft_skill' | 'combined' | null
  triggered_by: 'manager' | 'hr' | null
  linked_stage: 'screening' | 'interview'
  // Status (LOCKED: required, sent, completed, failed, waived)
  status: 'not_required' | 'required' | 'sent' | 'completed' | 'failed' | 'waived'
  // Details
  assessment_link?: string
  template_id?: number
  notes?: string
  // Results (after completion)
  score?: number
  result?: 'pass' | 'fail'
}

interface AssessmentTemplate {
  id: number
  name: string
  type: 'soft_skill' | 'technical'
  description: string
  duration_minutes: number
  is_default: boolean
}

// Assessment status labels - LOCKED
const STATUS_LABELS: Record<string, string> = {
  not_required: 'Not Required',
  required: 'Assessment Required',
  sent: 'Sent to Candidate',
  completed: 'Completed',
  failed: 'Failed',
  waived: 'Waived'
}

// Status styles
const STATUS_STYLES: Record<string, string> = {
  not_required: 'bg-slate-100 text-slate-500',
  required: 'bg-amber-100 text-amber-700',
  sent: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  waived: 'bg-slate-100 text-slate-600'
}

export function AssessmentConfig({
  recruitmentRequestId,
  candidateId,
  positionTitle,
  jobDescription,
  token,
  entityColor = '#1800ad',
  viewMode,
  currentStage = 'screening',
  onConfigSaved,
  onClose,
  readonly = false
}: AssessmentConfigProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [config, setConfig] = useState<AssessmentConfigData>({
    assessment_type: null,
    triggered_by: null,
    linked_stage: currentStage,
    status: 'not_required',
    notes: ''
  })
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([])
  const [generatingAssessment, setGeneratingAssessment] = useState(false)

  const API_URL = '/api'
  
  // Manager can only trigger technical, HR can trigger soft_skill or combined
  const canTriggerTechnical = viewMode === 'manager'
  const canTriggerSoftSkill = viewMode === 'hr'
  const canTriggerCombined = viewMode === 'hr'  // HR initiates combined, manager confirms

  useEffect(() => {
    fetchConfig()
    fetchTemplates()
  }, [recruitmentRequestId])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const endpoint = candidateId 
        ? `${API_URL}/recruitment/candidates/${candidateId}/assessment-config`
        : `${API_URL}/recruitment/requests/${recruitmentRequestId}/assessment-config`
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (err) {
      console.error('Failed to fetch assessment config:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/recruitment/assessment-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    }
  }

  const handleAssessmentTypeSelect = async (type: 'technical' | 'soft_skill' | 'combined') => {
    if (readonly) return
    setErrorMessage(null)
    
    // Validate who can trigger what
    if (type === 'technical' && !canTriggerTechnical) {
      setErrorMessage('Only managers can trigger technical assessments')
      return
    }
    if ((type === 'soft_skill' || type === 'combined') && !canTriggerSoftSkill) {
      setErrorMessage('Only HR can trigger soft skill or combined assessments')
      return
    }
    
    const newConfig: AssessmentConfigData = {
      ...config,
      assessment_type: type,
      triggered_by: viewMode,
      linked_stage: currentStage,
      status: 'required'
    }
    setConfig(newConfig)

    // For technical assessments, trigger auto-generation if job description available
    if (type === 'technical' && jobDescription) {
      setGeneratingAssessment(true)
      try {
        const response = await fetch(`${API_URL}/recruitment/requests/${recruitmentRequestId}/generate-assessment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'technical',
            job_description: jobDescription,
            position_title: positionTitle
          })
        })
        if (response.ok) {
          const data = await response.json()
          setConfig(prev => ({
            ...prev,
            assessment_link: data.assessment_link
          }))
        }
      } catch (err) {
        console.error('Failed to generate assessment:', err)
      } finally {
        setGeneratingAssessment(false)
      }
    }
  }

  const handleClearAssessment = () => {
    if (readonly) return
    setConfig({
      assessment_type: null,
      triggered_by: null,
      linked_stage: currentStage,
      status: 'not_required',
      notes: ''
    })
  }

  const handleTemplateSelect = (templateId: number) => {
    if (readonly) return
    setConfig(prev => ({
      ...prev,
      template_id: templateId
    }))
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      const endpoint = candidateId 
        ? `${API_URL}/recruitment/candidates/${candidateId}/assessment-config`
        : `${API_URL}/recruitment/requests/${recruitmentRequestId}/assessment-config`
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })
      if (response.ok) {
        onConfigSaved?.(config)
        onClose?.()
      }
    } catch (err) {
      console.error('Failed to save config:', err)
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.not_required}`}>
        {STATUS_LABELS[status] || 'Unknown'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#1800ad] rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-500">Loading assessment configuration...</p>
      </div>
    )
  }

  const isAssessmentRequired = config.assessment_type !== null

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-md w-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Assessment Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">{positionTitle}</p>
            <p className="text-[10px] text-slate-400">Stage: {currentStage}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Error Message Display */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-red-700">{errorMessage}</p>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="text-[10px] text-red-500 hover:text-red-700 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">Current Status:</span>
          {getStatusBadge(config.status)}
        </div>

        {/* Assessment Type Selection */}
        {!isAssessmentRequired ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-700">Select Assessment Type:</p>
            
            {/* Technical Assessment - Manager Only */}
            {canTriggerTechnical && (
              <button
                onClick={() => handleAssessmentTypeSelect('technical')}
                disabled={readonly || generatingAssessment}
                className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${entityColor}15` }}>
                    <svg className="w-5 h-5" style={{ color: entityColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Technical Assessment</p>
                    <p className="text-[10px] text-slate-500">Manager-triggered • Tests role competence</p>
                  </div>
                </div>
              </button>
            )}

            {/* Soft Skill Assessment - HR Only */}
            {canTriggerSoftSkill && (
              <button
                onClick={() => handleAssessmentTypeSelect('soft_skill')}
                disabled={readonly}
                className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Soft Skill Assessment</p>
                    <p className="text-[10px] text-slate-500">HR-triggered • Tests culture & behavior</p>
                  </div>
                </div>
              </button>
            )}

            {/* Combined Assessment - HR Only */}
            {canTriggerCombined && (
              <button
                onClick={() => handleAssessmentTypeSelect('combined')}
                disabled={readonly}
                className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Combined Assessment</p>
                    <p className="text-[10px] text-slate-500">HR + Manager • For senior/critical roles</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        ) : (
          /* Assessment Selected - Show Details */
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
                  style={{ 
                    backgroundColor: config.assessment_type === 'technical' ? `${entityColor}15` :
                      config.assessment_type === 'soft_skill' ? '#ecfdf5' : '#f3e8ff'
                  }}>
                  <svg className="w-4 h-4" 
                    style={{ 
                      color: config.assessment_type === 'technical' ? entityColor :
                        config.assessment_type === 'soft_skill' ? '#059669' : '#9333ea'
                    }} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 capitalize">
                    {config.assessment_type?.replace('_', ' ')} Assessment
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Triggered by: {config.triggered_by?.toUpperCase()}
                  </p>
                </div>
              </div>
              {!readonly && config.status === 'required' && (
                <button
                  onClick={handleClearAssessment}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            {generatingAssessment && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg mb-3">
                <div className="w-4 h-4 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                <span className="text-xs text-amber-700">Generating assessment...</span>
              </div>
            )}

            {config.assessment_link && (
              <div className="mb-3">
                <a 
                  href={config.assessment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium hover:underline"
                  style={{ color: entityColor }}
                >
                  Preview Assessment →
                </a>
              </div>
            )}

            {/* Template Selection for Soft Skills */}
            {config.assessment_type === 'soft_skill' && templates.filter(t => t.type === 'soft_skill').length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-500 mb-2">Select Template:</p>
                <div className="space-y-1.5">
                  {templates.filter(t => t.type === 'soft_skill').map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      disabled={readonly}
                      className={`w-full p-2 rounded-lg text-left transition-colors ${
                        config.template_id === template.id
                          ? 'bg-emerald-50 border-2 border-emerald-500'
                          : 'bg-white border border-slate-200 hover:border-slate-300'
                      } ${readonly ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">{template.name}</span>
                        <span className="text-[9px] text-slate-400">{template.duration_minutes} min</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{template.description}</p>
                      {template.is_default && (
                        <span className="inline-block mt-1 text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded font-medium">
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
          <textarea
            value={config.notes || ''}
            onChange={(e) => !readonly && setConfig(prev => ({ ...prev, notes: e.target.value }))}
            disabled={readonly}
            placeholder="Any specific requirements or notes..."
            className={`w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1800ad]/20 ${
              readonly ? 'opacity-50' : ''
            }`}
            rows={2}
          />
        </div>

        {/* Info Notice */}
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex gap-2">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <strong>Role-based control:</strong> Manager triggers technical assessments. 
              HR triggers soft skill assessments. Combined assessments require both. 
              Candidate sees only "Assessment in Progress" - no type labels exposed.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!readonly && (
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex-1 py-2.5 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: entityColor }}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </div>
  )
}
