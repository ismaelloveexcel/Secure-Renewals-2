import { useState, useEffect } from 'react'
import { 
  BasePassContainer, 
  PassHeader, 
  ActionRequired,
  PassTab 
} from '../BasePass'

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

type ActiveTab = 'home' | 'documents' | 'calendar' | 'contact'

interface ManagerPassProps {
  recruitmentRequestId: number
  managerId: string
  token: string
  onBack?: () => void
}

const MANAGER_TABS: PassTab[] = [
  { id: 'home', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'documents', label: 'Docs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'contact', label: 'HR', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

const ENTITY_COLOR = '#00B0F0'

export function ManagerPass({ recruitmentRequestId, managerId, token, onBack }: ManagerPassProps) {
  const [passData, setPassData] = useState<ManagerPassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('home')
  const [showInterviewSetup, setShowInterviewSetup] = useState(false)
  const [setupForm, setSetupForm] = useState({
    technical_assessment_required: false,
    interview_format: 'online',
    interview_rounds: 2,
    notes: ''
  })
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])

  const API_URL = '/api'

  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ]

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
          ...setupForm,
          additional_interviewers: []
        })
      })
      if (!response.ok) throw new Error('Failed to save setup')
      
      let setupData = null
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json') && response.status !== 204) {
        try {
          setupData = await response.json()
        } catch {
          setupData = null
        }
      }
      
      if (selectedDates.length > 0 && selectedSlots.length > 0 && setupData?.id) {
        const slotsPayload = {
          interview_setup_id: setupData.id,
          dates: selectedDates,
          time_slots: selectedSlots.map(slot => {
            const [start, end] = slot.split('-')
            return { start_time: start + ':00', end_time: end + ':00' }
          }),
          round_number: 1
        }
        
        await fetch(`${API_URL}/interview/slots/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(slotsPayload)
        })
      }
      
      setShowInterviewSetup(false)
      setSelectedDates([])
      setSelectedSlots([])
      await fetchPassData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const getActionRequired = () => {
    if (!passData) return null
    
    if (!passData.interview_setup) {
      return {
        label: 'Configure Interview',
        description: 'Set up interview format and rounds',
        onClick: () => setShowInterviewSetup(true),
        loading: false
      }
    }
    
    if (passData.confirmed_interviews.length === 0 && passData.pipeline_stats['interview'] > 0) {
      return {
        label: 'Add Interview Slots',
        description: 'Provide available times for candidates',
        onClick: () => setShowInterviewSetup(true),
        loading: false
      }
    }
    
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-lg rounded-2xl p-6 max-w-sm text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-medium text-slate-800 mb-1">Access Error</h2>
          <p className="text-sm text-slate-500">{error || 'Unable to load pass'}</p>
          {onBack && (
            <button onClick={onBack} className="mt-4 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
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

  const actionRequired = getActionRequired()

  const renderHeader = () => (
    <PassHeader
      title={passData.position_title}
      subtitle={passData.department}
      referenceId={passData.pass_id}
      entityColor={ENTITY_COLOR}
      entityName="Manager Pass"
      avatar={passData.manager_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      statusBadge={
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
            passData.position_status === 'open' || passData.position_status === 'pending'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {passData.position_status}
          </span>
          <span className="text-[9px] text-slate-400">SLA: {passData.sla_days}d</span>
        </div>
      }
      actions={
        onBack && (
          <button onClick={onBack} className="p-1 -ml-1 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )
      }
    />
  )

  const renderActionRequired = () => (
    <ActionRequired action={actionRequired} entityColor={ENTITY_COLOR} />
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            {/* STATS ROW */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Total', value: passData.total_candidates },
                { label: 'Interview', value: passData.pipeline_stats['interview'] || 0 },
                { label: 'Scheduled', value: passData.confirmed_interviews.length },
                { label: 'Offers', value: passData.pipeline_stats['offer'] || 0 }
              ].map(stat => (
                <div key={stat.label} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                  <p className="text-base font-bold text-slate-800">{stat.value}</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* PIPELINE */}
            <div className="mb-4">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Pipeline</p>
              <div className="space-y-1.5">
                {['applied', 'screening', 'interview', 'offer', 'hired'].map(stage => (
                  <div key={stage} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-700 font-medium">{stageLabels[stage]}</span>
                    <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      {passData.pipeline_stats[stage] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* INTERVIEW SETUP DISPLAY */}
            {passData.interview_setup && !showInterviewSetup && (
              <div className="mb-4">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Interview Setup</p>
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Format</p>
                      <p className="text-xs font-semibold text-slate-700 capitalize">{passData.interview_setup.interview_format}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Rounds</p>
                      <p className="text-xs font-semibold text-slate-700">{passData.interview_setup.interview_rounds}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Assessment</p>
                      <p className="text-xs font-semibold text-slate-700">{passData.interview_setup.technical_assessment_required ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INTERVIEW SETUP FORM */}
            {showInterviewSetup && (
              <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-700">Interview Configuration</p>
                  <button onClick={() => setShowInterviewSetup(false)} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase mb-1">Technical Assessment?</p>
                    <div className="flex gap-2">
                      {[true, false].map(val => (
                        <button
                          key={String(val)}
                          onClick={() => setSetupForm({ ...setupForm, technical_assessment_required: val })}
                          className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                            setupForm.technical_assessment_required === val
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {val ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500 uppercase mb-1">Format</p>
                    <div className="flex gap-2">
                      {['online', 'in-person', 'hybrid'].map(format => (
                        <button
                          key={format}
                          onClick={() => setSetupForm({ ...setupForm, interview_format: format })}
                          className={`flex-1 py-1.5 text-[10px] rounded-lg border transition-colors capitalize ${
                            setupForm.interview_format === format
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500 uppercase mb-1">Rounds</p>
                    <select
                      value={setupForm.interview_rounds}
                      onChange={(e) => setSetupForm({ ...setupForm, interview_rounds: parseInt(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{n} Round{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500 uppercase mb-1">Add Interview Dates</p>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        if (e.target.value && !selectedDates.includes(e.target.value)) {
                          setSelectedDates([...selectedDates, e.target.value])
                        }
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                    {selectedDates.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedDates.map(date => (
                          <span key={date} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">
                            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            <button onClick={() => setSelectedDates(selectedDates.filter(d => d !== date))} className="text-slate-400 hover:text-slate-600">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500 uppercase mb-1">Time Slots</p>
                    <div className="grid grid-cols-3 gap-1">
                      {timeSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => {
                            if (selectedSlots.includes(slot)) {
                              setSelectedSlots(selectedSlots.filter(s => s !== slot))
                            } else {
                              setSelectedSlots([...selectedSlots, slot])
                            }
                          }}
                          className={`py-1.5 text-[9px] rounded-lg border transition-colors ${
                            selectedSlots.includes(slot)
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={saveInterviewSetup}
                    className="w-full py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            )}
          </>
        )

      case 'documents':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Documents</h3>
                <p className="text-[10px] text-slate-400">Recruitment documents</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">Job Description</p>
                      <p className="text-[10px] text-slate-400">Required document</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    passData.jd_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    passData.jd_status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {passData.jd_status}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">Recruitment Form</p>
                      <p className="text-[10px] text-slate-400">Required document</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    passData.recruitment_form_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    passData.recruitment_form_status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {passData.recruitment_form_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'calendar':
        return (
          <div className="grid grid-cols-2 gap-3 h-full">
            {/* LEFT: Calendar */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-[8px] text-slate-400 font-medium py-1">{d}</div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 1
                  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
                  const hasInterview = passData.confirmed_interviews.some(slot => new Date(slot.slot_date).getDate() === day)
                  const isToday = day === new Date().getDate()
                  return (
                    <div 
                      key={i} 
                      className={`text-[10px] py-1 rounded-md cursor-pointer transition-colors ${
                        hasInterview ? 'bg-blue-500 text-white font-bold' :
                        isToday ? 'bg-slate-100 font-semibold text-slate-800' :
                        day > 0 && day <= daysInMonth ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-200'
                      }`}
                    >
                      {day > 0 && day <= daysInMonth ? day : ''}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-[8px] text-slate-400">Scheduled</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Interview Details */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Scheduled Interviews</h4>
                  <p className="text-[9px] text-slate-400">{passData.confirmed_interviews.length} confirmed</p>
                </div>
              </div>

              {passData.confirmed_interviews.length > 0 ? (
                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-40">
                  {passData.confirmed_interviews.slice(0, 5).map(slot => (
                    <div key={slot.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-medium text-slate-700">
                        {new Date(slot.slot_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[9px] text-slate-500">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</p>
                      {slot.candidate_name && (
                        <p className="text-[9px] text-blue-600 font-medium mt-0.5">{slot.candidate_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">No interviews scheduled</p>
                  <p className="text-[9px] text-slate-400">Add slots to start scheduling</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Contact HR</p>
            {[
              { label: 'Email HR', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', action: () => window.location.href = `mailto:${passData.hr_email}` },
              { label: 'WhatsApp HR', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', action: () => window.open(`https://wa.me/${passData.hr_whatsapp}`, '_blank') },
              { label: 'Request Support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', action: () => {} }
            ].map(item => (
              <button 
                key={item.label} 
                onClick={item.action}
                className="w-full p-3 bg-slate-50 rounded-xl flex items-center gap-3 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-700 flex-1">{item.label}</span>
                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <BasePassContainer
      entityColor={ENTITY_COLOR}
      header={renderHeader()}
      actionRequired={activeTab === 'home' ? renderActionRequired() : undefined}
      tabs={MANAGER_TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
    >
      {renderContent()}
    </BasePassContainer>
  )
}
