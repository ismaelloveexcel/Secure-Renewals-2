/**
 * HR Applicant List View (Pipeline View)
 * 
 * LOCKED DESIGN DECISION:
 * Purpose: Fast scanning, Decision prioritization, Bottleneck visibility, Zero scrolling into profiles unless necessary
 * 
 * FIELDS THAT SHOULD APPEAR:
 * - Identity: Candidate Name, Current Job Title, Current Company
 * - Role Fit: Applied Position, Years of Experience (rounded), Location/Country
 * - Progress: Current Stage, Current Status, Assessment Status, Interview Status
 * - Signals: Assessment Score (if any), Interview Outcome (icon)
 * - Risk: Days in Stage (counter), On Hold Flag
 * 
 * MUST NOT APPEAR IN LIST VIEW:
 * - CV text, Salary expectations, Soft skill comments, Internal notes, Detailed assessment breakdown
 * 
 * Why: list view is for velocity, not judgment.
 * 
 * GOVERNING LOGIC:
 * - HR is the superuser - only HR can manually revise passes
 * - Candidates cannot edit their own stage/status
 * - All stage movements are HR/System triggered
 */

import React, { useState, useEffect, useMemo } from 'react'
import { getEntityColor } from '../BasePass'

interface CandidateListItem {
  id: number
  candidate_number: string
  // Identity (from CV - auto)
  full_name: string
  email?: string
  current_job_title?: string
  current_company?: string
  // Role Fit
  recruitment_request_id: number
  position_title: string  // Applied Position
  years_experience?: number  // Rounded
  current_location?: string  // Location/Country
  // Progress (System)
  stage: string
  status: string
  assessment_status?: 'none' | 'required' | 'sent' | 'completed' | 'failed' | 'waived'
  interview_status?: 'none' | 'pending' | 'scheduled' | 'completed' | 'no_show'
  // Signals
  assessment_score?: number
  interview_outcome?: 'pending' | 'pass' | 'fail' | 'hold'
  // Risk
  days_in_stage: number
  on_hold: boolean
  // Internal (for filtering, not display)
  department: string
  entity?: string
  applied_at: string
}

interface RecruitmentRequestSummary {
  id: number
  request_number: string
  position_title: string
  department: string
  total_candidates: number
  status: string
}

interface HRApplicantListProps {
  token: string
  onSelectCandidate?: (candidateId: number) => void
  onBulkAction?: (action: string, candidateIds: number[]) => void
}

// Stage colors for visual distinction
const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  applied: { bg: 'bg-slate-100', text: 'text-slate-700' },
  application: { bg: 'bg-slate-100', text: 'text-slate-700' },
  screening: { bg: 'bg-blue-100', text: 'text-blue-700' },
  shortlisted: { bg: 'bg-purple-100', text: 'text-purple-700' },
  interview: { bg: 'bg-amber-100', text: 'text-amber-700' },
  offer: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  hired: { bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' }
}

// Sticky header offset (calculated from header height)
const BULK_ACTIONS_TOP_OFFSET = 180

export function HRApplicantList({ token, onSelectCandidate, onBulkAction }: HRApplicantListProps) {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([])
  const [requests, setRequests] = useState<RecruitmentRequestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null)
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set())
  const [sortBy, setSortBy] = useState<'applied_at' | 'days_in_stage' | 'assessment_score' | 'name'>('applied_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [filterOnHold, setFilterOnHold] = useState<boolean | null>(null)
  const [filterAssessment, setFilterAssessment] = useState<string>('all')

  const API_URL = '/api'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [candidatesRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/recruitment/candidates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/recruitment/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (candidatesRes.ok) {
        const data = await candidatesRes.json()
        setCandidates(data)
      }
      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setRequests(data)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = [...candidates]

    // Filter by request
    if (selectedRequest) {
      result = result.filter(c => c.recruitment_request_id === selectedRequest)
    }

    // Filter by stage
    if (selectedStage !== 'all') {
      result = result.filter(c => c.stage.toLowerCase() === selectedStage.toLowerCase())
    }

    // Filter by on-hold status
    if (filterOnHold !== null) {
      result = result.filter(c => c.on_hold === filterOnHold)
    }

    // Filter by assessment status
    if (filterAssessment !== 'all') {
      result = result.filter(c => c.assessment_status === filterAssessment)
    }

    // Search filter (name, job title, company, position, email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.full_name.toLowerCase().includes(query) ||
        (c.email?.toLowerCase() || '').includes(query) ||
        (c.current_job_title?.toLowerCase() || '').includes(query) ||
        (c.current_company?.toLowerCase() || '').includes(query) ||
        c.candidate_number.toLowerCase().includes(query) ||
        c.position_title.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'applied_at':
          comparison = new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()
          break
        case 'days_in_stage':
          comparison = a.days_in_stage - b.days_in_stage
          break
        case 'assessment_score':
          comparison = (a.assessment_score || 0) - (b.assessment_score || 0)
          break
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name)
          break
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return result
  }, [candidates, selectedRequest, selectedStage, searchQuery, sortBy, sortOrder, filterOnHold, filterAssessment])

  // Stage counts for filter tabs
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: candidates.length }
    candidates.forEach(c => {
      const stage = c.stage.toLowerCase()
      counts[stage] = (counts[stage] || 0) + 1
    })
    return counts
  }, [candidates])

  const toggleCandidateSelection = (id: number) => {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCandidates(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const selectAllVisible = () => {
    const newSelected = new Set(filteredCandidates.map(c => c.id))
    setSelectedCandidates(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const clearSelection = () => {
    setSelectedCandidates(new Set())
    setShowBulkActions(false)
  }

  const handleBulkAction = (action: string) => {
    onBulkAction?.(action, Array.from(selectedCandidates))
    clearSelection()
  }

  const getStageColor = (stage: string) => {
    return STAGE_COLORS[stage.toLowerCase()] || STAGE_COLORS.applied
  }

  const stages = ['all', 'applied', 'screening', 'interview', 'offer', 'hired', 'rejected']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading candidates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-slate-800">All Applicants</h1>
              <p className="text-xs text-slate-500">{candidates.length} total across {requests.length} positions</p>
            </div>
            <button
              onClick={fetchData}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Position Filter */}
          <div className="mb-3">
            <select
              value={selectedRequest || ''}
              onChange={(e) => setSelectedRequest(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="">All Positions ({candidates.length})</option>
              {requests.map(req => (
                <option key={req.id} value={req.id}>
                  {req.position_title} - {req.department} ({req.total_candidates})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or position..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          {/* Stage Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
            {stages.map(stage => {
              const colors = stage === 'all' 
                ? { bg: 'bg-slate-100', text: 'text-slate-700' }
                : getStageColor(stage)
              const isActive = selectedStage === stage
              return (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive 
                      ? `${colors.bg} ${colors.text}` 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {stage === 'all' ? 'All' : stage.charAt(0).toUpperCase() + stage.slice(1)}
                  <span className="ml-1 text-[10px]">({stageCounts[stage] || 0})</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className={`bg-purple-50 border-b border-purple-100 px-4 py-3 flex items-center justify-between sticky z-10`} style={{ top: `${BULK_ACTIONS_TOP_OFFSET}px` }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-purple-700">
              {selectedCandidates.size} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-purple-600 hover:text-purple-800"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('move_to_screening')}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              → Screening
            </button>
            <button
              onClick={() => handleBulkAction('move_to_interview')}
              className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
            >
              → Interview
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Selection Controls & Additional Filters */}
      <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={selectAllVisible}
            className="text-xs text-purple-600 hover:text-purple-800"
          >
            Select All ({filteredCandidates.length})
          </button>
          {/* On Hold Filter */}
          <button
            onClick={() => setFilterOnHold(filterOnHold === true ? null : true)}
            className={`text-xs px-2 py-1 rounded ${filterOnHold === true ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            🚩 On Hold
          </button>
          {/* Assessment Filter */}
          <select
            value={filterAssessment}
            onChange={(e) => setFilterAssessment(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
          >
            <option value="all">All Assessments</option>
            <option value="required">Required</option>
            <option value="sent">Sent</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sort:</span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-') as ['applied_at' | 'days_in_stage' | 'assessment_score' | 'name', 'asc' | 'desc']
              setSortBy(by)
              setSortOrder(order)
            }}
            className="text-xs border-none bg-transparent text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="applied_at-desc">Newest First</option>
            <option value="applied_at-asc">Oldest First</option>
            <option value="days_in_stage-desc">Longest in Stage</option>
            <option value="assessment_score-desc">Best Score</option>
            <option value="name-asc">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Candidate List - PIPELINE VIEW */}
      <div className="px-4 py-3 space-y-2">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm text-slate-500">No candidates found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters</p>
          </div>
        ) : (
          filteredCandidates.map(candidate => {
            const stageColors = getStageColor(candidate.stage)
            const entityColor = getEntityColor(candidate.entity || '')
            const isSelected = selectedCandidates.has(candidate.id)
            
            // Assessment status indicator
            const getAssessmentIcon = () => {
              switch (candidate.assessment_status) {
                case 'required': return { icon: '📋', color: 'text-amber-600', label: 'Required' }
                case 'sent': return { icon: '📤', color: 'text-blue-600', label: 'Sent' }
                case 'completed': return { icon: '✅', color: 'text-emerald-600', label: 'Done' }
                case 'failed': return { icon: '❌', color: 'text-red-600', label: 'Failed' }
                case 'waived': return { icon: '⏭️', color: 'text-slate-500', label: 'Waived' }
                default: return null
              }
            }
            
            // Interview outcome icon
            const getInterviewIcon = () => {
              switch (candidate.interview_outcome) {
                case 'pass': return { icon: '👍', color: 'text-emerald-600' }
                case 'fail': return { icon: '👎', color: 'text-red-600' }
                case 'hold': return { icon: '⏸️', color: 'text-amber-600' }
                case 'pending': return { icon: '🕐', color: 'text-blue-600' }
                default: return null
              }
            }
            
            const assessmentInfo = getAssessmentIcon()
            const interviewInfo = getInterviewIcon()

            return (
              <div
                key={candidate.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                  isSelected ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-100'
                } ${candidate.on_hold ? 'border-l-4 border-l-amber-400' : ''}`}
              >
                <div className="flex">
                  {/* Selection checkbox */}
                  <div className="flex items-center px-3 border-r border-slate-100">
                    <button
                      onClick={() => toggleCandidateSelection(candidate.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300 hover:border-purple-400'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Main content - PIPELINE VIEW FIELDS ONLY */}
                  <div 
                    className="flex-1 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => onSelectCandidate?.(candidate.id)}
                  >
                    {/* Row 1: Identity (Name, Job Title, Company) */}
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-800 truncate">{candidate.full_name}</h3>
                          {candidate.on_hold && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">ON HOLD</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {candidate.current_job_title || 'No title'} 
                          {candidate.current_company && ` at ${candidate.current_company}`}
                        </p>
                      </div>
                      {/* Days in Stage (Risk indicator) */}
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${stageColors.bg} ${stageColors.text}`}>
                          {candidate.stage}
                        </span>
                        <span className={`text-[10px] ${candidate.days_in_stage > 14 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                          {candidate.days_in_stage}d in stage
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Role Fit (Position, Experience, Location) */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                      <span 
                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entityColor }}
                      />
                      <span className="truncate font-medium">{candidate.position_title}</span>
                      <span className="text-slate-300">•</span>
                      <span>{candidate.years_experience || 0}y exp</span>
                      {candidate.current_location && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="truncate">{candidate.current_location}</span>
                        </>
                      )}
                    </div>

                    {/* Row 3: Progress & Signals (Assessment, Interview, Score) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Assessment Status */}
                        {assessmentInfo && (
                          <span className={`inline-flex items-center gap-1 text-[9px] ${assessmentInfo.color}`}>
                            <span>{assessmentInfo.icon}</span>
                            <span>{assessmentInfo.label}</span>
                          </span>
                        )}
                        {/* Interview Status */}
                        {candidate.interview_status && candidate.interview_status !== 'none' && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-blue-600">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="capitalize">{candidate.interview_status}</span>
                          </span>
                        )}
                        {/* Interview Outcome Icon */}
                        {interviewInfo && (
                          <span className={`text-sm ${interviewInfo.color}`}>{interviewInfo.icon}</span>
                        )}
                      </div>
                      {/* Assessment Score (Signal) */}
                      {candidate.assessment_score !== undefined && candidate.assessment_score > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">
                          Score: {candidate.assessment_score}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-col justify-center px-2 border-l border-slate-100">
                    <button
                      onClick={() => onSelectCandidate?.(candidate.id)}
                      className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                      title="View Details"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer Stats */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Showing {filteredCandidates.length} of {candidates.length}</span>
          <span className="text-purple-600 font-medium">HR Superuser Mode</span>
        </div>
      </div>
    </div>
  )
}
