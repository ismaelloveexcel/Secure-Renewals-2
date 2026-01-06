import { useState, useEffect } from 'react'

interface ManagerPassData {
  pass_id: string
  pass_token: string
  manager_id: string
  manager_name: string
  department: string
  position_id: number
  position_title: string
  position_status: string
  sla_days: number
  documents: RecruitmentDocument[]
  jd_status: string
  recruitment_form_status: string
  pipeline_stats: Record<string, number>
  total_candidates: number
  interview_setup: InterviewSetup | null
  confirmed_interviews: InterviewSlot[]
  unread_messages: number
  hr_whatsapp: string
  hr_email: string
}

interface RecruitmentDocument {
  id: number
  document_type: string
  document_name: string
  file_path: string | null
  status: string
  submitted_at: string | null
}

interface InterviewSetup {
  id: number
  technical_assessment_required: boolean
  interview_format: string
  interview_rounds: number
  notes: string | null
}

interface InterviewSlot {
  id: number
  slot_date: string
  start_time: string
  end_time: string
  round_number: number
  candidate_name: string | null
  candidate_confirmed: boolean
}

type ActiveTab = 'pipeline' | 'documents' | 'interviews' | 'calendar' | 'contact'

interface ManagerPassProps {
  recruitmentRequestId: number
  managerId: string
  token: string
  onBack?: () => void
}

export function ManagerPass({ recruitmentRequestId, managerId, token, onBack }: ManagerPassProps) {
  const [passData, setPassData] = useState<ManagerPassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('pipeline')
  const [showInterviewSetup, setShowInterviewSetup] = useState(false)
  const [setupForm, setSetupForm] = useState({
    interview_format: 'online',
    interview_rounds: 1,
    technical_assessment_required: false,
    notes: ''
  })
  const [newSlots, setNewSlots] = useState<Array<{ date: string; start: string; end: string }>>([])

  const API_URL = '/api'

  const entityColors = {
    primary: '#003D7A',
    secondary: '#E6F0FA',
    accent: '#0066CC'
  }

  useEffect(() => {
    fetchPassData()
  }, [recruitmentRequestId])

  const fetchPassData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/interview/pass/manager/${recruitmentRequestId}?manager_id=${managerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load pass data')
      const data = await response.json()
      setPassData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pass')
    } finally {
      setLoading(false)
    }
  }

  const saveInterviewSetup = async () => {
    try {
      const response = await fetch(`${API_URL}/interview/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recruitment_request_id: recruitmentRequestId,
          ...setupForm
        })
      })
      if (!response.ok) throw new Error('Failed to save setup')
      setShowInterviewSetup(false)
      await fetchPassData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const addSlotRow = () => {
    setNewSlots([...newSlots, { date: '', start: '09:00', end: '10:00' }])
  }

  const updateSlotRow = (idx: number, field: string, value: string) => {
    const updated = [...newSlots]
    updated[idx] = { ...updated[idx], [field]: value }
    setNewSlots(updated)
  }

  const removeSlotRow = (idx: number) => {
    setNewSlots(newSlots.filter((_, i) => i !== idx))
  }

  const createSlots = async () => {
    if (!passData?.interview_setup || newSlots.length === 0) return
    
    const validSlots = newSlots.filter(s => s.date && s.start && s.end)
    if (validSlots.length === 0) {
      alert('Please add at least one valid slot')
      return
    }

    try {
      const response = await fetch(`${API_URL}/interview/slots/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          interview_setup_id: passData.interview_setup.id,
          dates: validSlots.map(s => s.date),
          time_slots: validSlots.map(s => ({ start_time: s.start, end_time: s.end })),
          round_number: 1
        })
      })
      if (!response.ok) throw new Error('Failed to create slots')
      setNewSlots([])
      await fetchPassData()
      alert('Interview slots created successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create slots')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading manager pass...</p>
        </div>
      </div>
    )
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Error</h2>
          <p className="text-gray-600">{error || 'Unable to load pass data'}</p>
          {onBack && (
            <button onClick={onBack} className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Go Back
            </button>
          )}
        </div>
      </div>
    )
  }

  const stageLabels: Record<string, string> = {
    applied: 'Applied',
    screening: 'Screening',
    assessment: 'Assessment',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired'
  }

  const stageColors: Record<string, string> = {
    applied: '#64748b',
    screening: '#f59e0b',
    assessment: '#8b5cf6',
    interview: '#3b82f6',
    offer: '#10b981',
    hired: '#22c55e'
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="text-white p-6" style={{ backgroundColor: entityColors.primary }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <button onClick={onBack} className="text-white/80 hover:text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <span className="text-sm font-mono opacity-80">{passData.pass_id}</span>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Hiring for</p>
              <h1 className="text-2xl font-bold">{passData.position_title}</h1>
              <p className="opacity-90">{passData.department}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                passData.position_status === 'open' ? 'bg-green-500/20 text-green-100' : 'bg-gray-500/20 text-gray-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${passData.position_status === 'open' ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                {passData.position_status}
              </div>
              <p className="text-sm opacity-70 mt-2">SLA: {passData.sla_days} days</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{passData.total_candidates}</p>
              <p className="text-sm opacity-70">Total Candidates</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{passData.pipeline_stats['interview'] || 0}</p>
              <p className="text-sm opacity-70">In Interview</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{passData.confirmed_interviews.length}</p>
              <p className="text-sm opacity-70">Scheduled</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{passData.pipeline_stats['offer'] || 0}</p>
              <p className="text-sm opacity-70">Offers Sent</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex">
          {[
            { id: 'pipeline', label: 'Pipeline', icon: '📊' },
            { id: 'documents', label: 'Documents', icon: '📄' },
            { id: 'interviews', label: 'Setup', icon: '⚙️' },
            { id: 'calendar', label: 'Calendar', icon: '📅' },
            { id: 'contact', label: 'HR', icon: '💬' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex-1 py-4 px-2 text-center text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 text-blue-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === tab.id ? { borderColor: entityColors.primary } : {}}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Pipeline Visualization */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Candidate Pipeline</h2>
              <div className="flex gap-4">
                {['applied', 'screening', 'assessment', 'interview', 'offer', 'hired'].map(stage => (
                  <div key={stage} className="flex-1">
                    <div 
                      className="text-white text-center py-2 rounded-t-lg font-medium text-sm"
                      style={{ backgroundColor: stageColors[stage] }}
                    >
                      {stageLabels[stage]}
                    </div>
                    <div 
                      className="bg-gray-50 rounded-b-lg p-4 text-center border-2 border-t-0"
                      style={{ borderColor: stageColors[stage] }}
                    >
                      <p className="text-3xl font-bold text-gray-800">{passData.pipeline_stats[stage] || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">candidates</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Interviews</h2>
              {passData.confirmed_interviews.length > 0 ? (
                <div className="space-y-3">
                  {passData.confirmed_interviews.slice(0, 5).map(interview => (
                    <div key={interview.id} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">👤</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{interview.candidate_name || 'Candidate'}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(interview.slot_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} • {interview.start_time}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Confirmed
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No interviews scheduled yet</p>
                  <button 
                    onClick={() => setActiveTab('interviews')}
                    className="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    Set up interview slots →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Required Documents</h2>
              <div className="space-y-4">
                {/* JD Status */}
                <div className={`p-4 rounded-lg border-2 ${passData.jd_status === 'submitted' ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{passData.jd_status === 'submitted' ? '✅' : '📋'}</span>
                      <div>
                        <p className="font-medium text-gray-800">Job Description</p>
                        <p className="text-sm text-gray-600">{passData.jd_status === 'submitted' ? 'Submitted' : 'Pending submission'}</p>
                      </div>
                    </div>
                    {passData.jd_status !== 'submitted' && (
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                        Upload
                      </button>
                    )}
                  </div>
                </div>

                {/* Recruitment Form Status */}
                <div className={`p-4 rounded-lg border-2 ${passData.recruitment_form_status === 'submitted' ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{passData.recruitment_form_status === 'submitted' ? '✅' : '📝'}</span>
                      <div>
                        <p className="font-medium text-gray-800">Recruitment Request Form</p>
                        <p className="text-sm text-gray-600">{passData.recruitment_form_status === 'submitted' ? 'Submitted' : 'Pending submission'}</p>
                      </div>
                    </div>
                    {passData.recruitment_form_status !== 'submitted' && (
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                        Complete Form
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* All Documents */}
            {passData.documents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4">All Documents</h3>
                <div className="divide-y">
                  {passData.documents.map(doc => (
                    <div key={doc.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="font-medium text-gray-800">{doc.document_name}</p>
                          <p className="text-sm text-gray-500">{doc.document_type}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        doc.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="space-y-6">
            {/* Interview Setup */}
            {!passData.interview_setup ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Interview Setup</h2>
                {!showInterviewSetup ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚙️</div>
                    <p className="text-gray-600 mb-4">Configure interview settings to start scheduling</p>
                    <button 
                      onClick={() => setShowInterviewSetup(true)}
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                    >
                      Set Up Interviews
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interview Format</label>
                      <select
                        value={setupForm.interview_format}
                        onChange={(e) => setSetupForm({ ...setupForm, interview_format: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="online">Online (Video Call)</option>
                        <option value="in-person">In-Person</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rounds</label>
                      <select
                        value={setupForm.interview_rounds}
                        onChange={(e) => setSetupForm({ ...setupForm, interview_rounds: parseInt(e.target.value) })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} Round{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="tech-assessment"
                        checked={setupForm.technical_assessment_required}
                        onChange={(e) => setSetupForm({ ...setupForm, technical_assessment_required: e.target.checked })}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                      <label htmlFor="tech-assessment" className="text-gray-700">Require Technical Assessment</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        value={setupForm.notes}
                        onChange={(e) => setSetupForm({ ...setupForm, notes: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Any special instructions..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowInterviewSetup(false)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveInterviewSetup}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                      >
                        Save Setup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Setup Summary */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Interview Configuration</h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Active</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Format</p>
                      <p className="font-medium text-gray-800 capitalize">{passData.interview_setup.interview_format}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Rounds</p>
                      <p className="font-medium text-gray-800">{passData.interview_setup.interview_rounds}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Technical Test</p>
                      <p className="font-medium text-gray-800">{passData.interview_setup.technical_assessment_required ? 'Required' : 'Not Required'}</p>
                    </div>
                  </div>
                </div>

                {/* Add Time Slots */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Interview Slots</h2>
                  <p className="text-gray-600 text-sm mb-4">Create time slots for candidates to book their interviews</p>
                  
                  {newSlots.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {newSlots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="date"
                            value={slot.date}
                            onChange={(e) => updateSlotRow(idx, 'date', e.target.value)}
                            className="flex-1 p-2 border rounded-lg"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateSlotRow(idx, 'start', e.target.value)}
                            className="w-32 p-2 border rounded-lg"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateSlotRow(idx, 'end', e.target.value)}
                            className="w-32 p-2 border rounded-lg"
                          />
                          <button
                            onClick={() => removeSlotRow(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={addSlotRow}
                      className="px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Slot
                    </button>
                    {newSlots.length > 0 && (
                      <button
                        onClick={createSlots}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                      >
                        Create {newSlots.length} Slot{newSlots.length > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Confirmed Interviews</h2>
            {passData.confirmed_interviews.length > 0 ? (
              <div className="space-y-3">
                {passData.confirmed_interviews.map(interview => (
                  <div 
                    key={interview.id} 
                    className="p-4 rounded-lg border-l-4"
                    style={{ backgroundColor: entityColors.secondary, borderColor: entityColors.primary }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{interview.candidate_name || 'Candidate'}</p>
                        <p className="text-gray-600">
                          {new Date(interview.slot_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-500">{interview.start_time} - {interview.end_time}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                          Round {interview.round_number}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p>No confirmed interviews yet</p>
                <p className="text-sm mt-1">Candidates will appear here once they confirm their slots</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact HR</h2>
            <div className="space-y-4">
              <a
                href={`https://wa.me/${passData.hr_whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-lg bg-green-50 hover:bg-green-100"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">💬</div>
                <div>
                  <p className="font-medium text-gray-800">WhatsApp</p>
                  <p className="text-sm text-gray-600">{passData.hr_whatsapp}</p>
                </div>
              </a>
              <a
                href={`mailto:${passData.hr_email}`}
                className="flex items-center gap-4 p-4 rounded-lg bg-blue-50 hover:bg-blue-100"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl">✉️</div>
                <div>
                  <p className="font-medium text-gray-800">Email</p>
                  <p className="text-sm text-gray-600">{passData.hr_email}</p>
                </div>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ManagerPass
