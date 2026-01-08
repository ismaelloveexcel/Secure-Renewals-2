import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  BasePassContainer, 
  ActionRequired,
  JourneyTimeline,
  ActivityHistory,
  PassTab,
  UNIFIED_STAGES,
  getStageIndex,
  getStageLabel,
  getStatusLabel
} from '../BasePass'
import type { ActivityItem } from '../BasePass'

interface ManagerPassData {
  pass_id: string
  pass_token: string
  manager_id: string
  manager_name: string
  department: string
  position_id: number
  position_title: string
  position_status: string
  recruitment_request_number?: string
  sla_days: number
  entity?: string
  current_stage?: string
  status?: string
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
  activity_history?: ActivityItem[]
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

type ActiveTab = 'home' | 'documents' | 'interview' | 'engage'

interface ManagerPassProps {
  recruitmentRequestId: number
  managerId: string
  token: string
  onBack?: () => void
}

const MANAGER_TABS: PassTab[] = [
  { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'documents', label: 'Documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'interview', label: 'Interview', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'engage', label: 'Engage', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

export function ManagerPass({ recruitmentRequestId, managerId, token, onBack }: ManagerPassProps) {
  const [passData, setPassData] = useState<ManagerPassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('home')
  const [showInterviewSetup, setShowInterviewSetup] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
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

  const getEntityColor = () => {
    return passData?.entity?.includes('Agriculture') ? '#00bf63' : '#00B0F0'
  }

  const getEntityName = () => {
    if (!passData?.entity) return 'Baynunah Group'
    if (passData.entity.includes('Agriculture')) return 'Agriculture Division'
    if (passData.entity.includes('Water')) return 'Watergeneration'
    return passData.entity
  }

  const getPassUrl = () => {
    if (!passData) return ''
    return `${window.location.origin}/manager-pass/${recruitmentRequestId}?token=${passData.pass_token}`
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
        onClick: () => setActiveTab('interview'),
        loading: false
      }
    }
    
    if (passData.confirmed_interviews.length === 0 && passData.pipeline_stats['interview'] > 0) {
      return {
        label: 'Add Interview Slots',
        description: 'Provide available times for candidates',
        onClick: () => setActiveTab('interview'),
        loading: false
      }
    }
    
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 max-w-sm text-center">
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

  const entityColor = getEntityColor()
  const currentStageIndex = getStageIndex(UNIFIED_STAGES, passData.current_stage || 'application')
  const actionRequired = getActionRequired()

  const renderHeader = () => (
    <div className="flex-shrink-0 relative">
      {/* Top Header Bar - Deep Blue */}
      <div className="bg-[#1800ad] px-4 pt-4 pb-6">
        <div className="flex items-center justify-between">
          {/* Left: Pass Type */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white">Hiring Manager Pass</p>
          </div>
          
          {/* Right: Logo */}
          <img 
            src="/assets/logo-white.png" 
            alt="Baynunah" 
            className="h-5 opacity-90"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
      </div>
      
      {/* Info Card - overlapping the header */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-4 relative overflow-hidden">
          <div className="flex items-start gap-3">
            {/* Left: Info */}
            <div className="flex-1 min-w-0">
              {/* Small: Manager name and Pass reference */}
              <p className="text-[11px] text-slate-500 mb-0.5">{passData.manager_name}</p>
              <p className="text-[10px] font-mono text-slate-400 mb-2">{passData.pass_id}</p>
              
              {/* Large: Position and Department */}
              <h2 className="text-lg font-black text-slate-900 leading-tight">{passData.position_title}</h2>
              <p className="text-sm font-medium text-slate-600">{passData.department}</p>
            </div>
            
            {/* Right: QR Code */}
            <div 
              onClick={() => setShowQrModal(true)}
              className="flex-shrink-0 relative p-2 bg-white rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 group border border-slate-100"
            >
              <QRCodeSVG 
                value={getPassUrl()} 
                size={60}
                level="H"
                fgColor={entityColor}
              />
            </div>
          </div>
          
          {/* Stage/Status Row */}
          <div className="flex gap-6 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entityColor }}
              />
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Stage</p>
                <p className="text-xs font-bold text-slate-800">
                  {getStageLabel(passData.current_stage || 'application', 'manager')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Status</p>
                <p className="text-xs font-bold text-slate-800">
                  {getStatusLabel(passData.current_stage || 'application', passData.status || passData.position_status, 'manager')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Active Badge - Positioned in card */}
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase">Active</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bell icon - Floating */}
      {passData.unread_messages > 0 && (
        <div className="absolute top-3 right-14">
          <div className="relative">
            <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
              {passData.unread_messages}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  const renderJourney = () => (
    <JourneyTimeline 
      stages={UNIFIED_STAGES}
      currentStageIndex={currentStageIndex}
      entityColor={entityColor}
      viewType="manager"
    />
  )

  const renderActionRequired = () => (
    activeTab === 'home' ? (
      <ActionRequired action={actionRequired} entityColor={entityColor} />
    ) : null
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-3">
            {/* Pipeline Stats Summary */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Pipeline Overview</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                  <p className="text-lg font-bold text-slate-800">{passData.total_candidates || 0}</p>
                  <p className="text-[9px] text-slate-400">Total</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                  <p className="text-lg font-bold" style={{ color: entityColor }}>{passData.pipeline_stats['interview'] || 0}</p>
                  <p className="text-[9px] text-slate-400">Interview</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                  <p className="text-lg font-bold text-emerald-600">{passData.pipeline_stats['offer'] || 0}</p>
                  <p className="text-[9px] text-slate-400">Offer</p>
                </div>
              </div>
            </div>

            {/* Quick Status Card */}
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${entityColor}15` }}
                  >
                    <svg className="w-4 h-4" style={{ color: entityColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700">Position Status</p>
                    <p className="text-[10px] text-slate-400">Active recruitment</p>
                  </div>
                </div>
                <span 
                  className="text-[9px] px-2 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: `${entityColor}15`, color: entityColor }}
                >
                  {passData.position_status}
                </span>
              </div>
            </div>

            {/* Activity History - Full audit trail for managers */}
            {passData.activity_history && passData.activity_history.length > 0 && (
              <ActivityHistory 
                activities={passData.activity_history} 
                collapsed={true}
              />
            )}
          </div>
        )

      case 'documents':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Documents</h3>
                <p className="text-[10px] text-slate-400">Recruitment documents</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">Job Description</p>
                      <p className="text-[10px] text-slate-400">Required document</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                    passData.jd_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    passData.jd_status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {passData.jd_status}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">Recruitment Form</p>
                      <p className="text-[10px] text-slate-400">Required document</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
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

      case 'interview':
        return (
          <div className="space-y-2">
            {/* Split view: Calendar + Setup/Availability */}
            <div className="grid grid-cols-2 gap-2">
              {/* Left: Mini Calendar */}
              <div className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-slate-700">
                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex gap-0.5">
                    <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-[8px] text-slate-400 font-medium">{d}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 1
                    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
                    const isToday = day === new Date().getDate()
                    const hasInterview = passData.confirmed_interviews.some(s => new Date(s.slot_date).getDate() === day)
                    return (
                      <div 
                        key={i} 
                        className={`text-[9px] py-1 rounded transition-colors ${
                          hasInterview ? 'text-white font-bold' :
                          isToday ? 'bg-slate-100 font-semibold text-slate-800' :
                          day > 0 && day <= daysInMonth ? 'text-slate-600' : 'text-slate-200'
                        }`}
                        style={hasInterview ? { backgroundColor: entityColor } : {}}
                      >
                        {day > 0 && day <= daysInMonth ? day : ''}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right: Interview Setup or Availability */}
              <div className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
                {passData.interview_setup ? (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-700 mb-2">Availability</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-400">Format</span>
                        <span className="font-medium text-slate-700 capitalize">{passData.interview_setup.interview_format}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-400">Rounds</span>
                        <span className="font-medium text-slate-700">{passData.interview_setup.interview_rounds}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-400">Assessment</span>
                        <span className="font-medium text-slate-700">{passData.interview_setup.technical_assessment_required ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInterviewSetup(true)}
                      className="mt-2 w-full py-1.5 text-[9px] font-medium text-white rounded-lg transition-colors"
                      style={{ backgroundColor: entityColor }}
                    >
                      Add Time Slots
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <svg className="w-6 h-6 text-slate-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[10px] text-slate-500 mb-2">Setup Required</p>
                    <button
                      onClick={() => setShowInterviewSetup(true)}
                      className="px-3 py-1.5 text-[9px] font-semibold text-white rounded-lg transition-colors"
                      style={{ backgroundColor: entityColor }}
                    >
                      Interview Setup
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Interview Setup Modal/Panel */}
            {showInterviewSetup && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-700">Configure Interview</p>
                  <button onClick={() => setShowInterviewSetup(false)} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-slate-500 mb-1">Assessment?</p>
                      <div className="flex gap-1">
                        {[true, false].map(val => (
                          <button
                            key={String(val)}
                            onClick={() => setSetupForm({ ...setupForm, technical_assessment_required: val })}
                            className={`flex-1 py-1.5 text-[9px] rounded-lg border transition-colors ${
                              setupForm.technical_assessment_required === val ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                            style={setupForm.technical_assessment_required === val ? { backgroundColor: entityColor } : {}}
                          >
                            {val ? 'Yes' : 'No'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 mb-1">Rounds</p>
                      <select
                        value={setupForm.interview_rounds}
                        onChange={(e) => setSetupForm({ ...setupForm, interview_rounds: parseInt(e.target.value) })}
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-[10px] bg-white"
                      >
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500 mb-1">Format</p>
                    <div className="flex gap-1">
                      {['online', 'in-person', 'hybrid'].map(format => (
                        <button
                          key={format}
                          onClick={() => setSetupForm({ ...setupForm, interview_format: format })}
                          className={`flex-1 py-1.5 text-[9px] rounded-lg border transition-colors capitalize ${
                            setupForm.interview_format === format ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'
                          }`}
                          style={setupForm.interview_format === format ? { backgroundColor: entityColor } : {}}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-slate-500 mb-1">Add Dates</p>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value && !selectedDates.includes(e.target.value)) {
                            setSelectedDates([...selectedDates, e.target.value])
                          }
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-[10px] bg-white"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 mb-1">Selected: {selectedDates.length}</p>
                      <div className="flex flex-wrap gap-1 max-h-8 overflow-y-auto">
                        {selectedDates.slice(0, 3).map(date => (
                          <span key={date} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white text-slate-600 text-[8px] rounded border border-slate-200">
                            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            <button onClick={() => setSelectedDates(selectedDates.filter(d => d !== date))} className="text-slate-400">×</button>
                          </span>
                        ))}
                        {selectedDates.length > 3 && <span className="text-[8px] text-slate-400">+{selectedDates.length - 3}</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500 mb-1">Time Slots</p>
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
                          className={`py-1 text-[8px] rounded-lg border transition-colors ${
                            selectedSlots.includes(slot) ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'
                          }`}
                          style={selectedSlots.includes(slot) ? { backgroundColor: entityColor } : {}}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={saveInterviewSetup}
                    className="w-full py-2 text-white text-[10px] font-semibold rounded-lg transition-colors"
                    style={{ backgroundColor: entityColor }}
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            )}

            {/* Confirmed Interviews List */}
            {passData.interview_setup && passData.confirmed_interviews.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Confirmed Candidates</p>
                <div className="space-y-1.5">
                  {passData.confirmed_interviews.map(interview => (
                    <div key={interview.id} className="rounded-lg bg-white p-2 border border-slate-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-medium text-slate-800">{interview.candidate_name || 'Candidate'}</p>
                        <p className="text-[9px] text-slate-500">
                          {new Date(interview.slot_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} • {interview.start_time.substring(0, 5)}
                        </p>
                      </div>
                      <span 
                        className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ 
                          backgroundColor: interview.candidate_confirmed ? '#dcfce7' : '#fef3c7',
                          color: interview.candidate_confirmed ? '#166534' : '#92400e'
                        }}
                      >
                        {interview.candidate_confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when no confirmed interviews */}
            {passData.interview_setup && passData.confirmed_interviews.length === 0 && !showInterviewSetup && (
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <svg className="w-6 h-6 text-slate-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-[10px] text-slate-500">No confirmed interviews yet</p>
                <p className="text-[9px] text-slate-400">Candidates will appear here once they book</p>
              </div>
            )}
          </div>
        )

      case 'engage':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Contact HR</h3>
                <p className="text-[10px] text-slate-400">Get support from HR team</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a 
                href={`https://wa.me/${passData.hr_whatsapp?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-emerald-700">WhatsApp</span>
              </a>
              
              <a 
                href={`mailto:${passData.hr_email}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-blue-700">Email</span>
              </a>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-700 mb-1">HR Contact</p>
              <p className="text-[11px] text-slate-500">{passData.hr_email}</p>
              {passData.hr_whatsapp && (
                <p className="text-[11px] text-slate-500">{passData.hr_whatsapp}</p>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <BasePassContainer
        entityColor={entityColor}
        entityName={getEntityName()}
        passType="manager"
        header={renderHeader()}
        journey={renderJourney()}
        actionRequired={renderActionRequired()}
        tabs={MANAGER_TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      >
        {renderContent()}
      </BasePassContainer>

      {/* QR Modal */}
      {showQrModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">Manager Pass QR</h3>
            <div className="inline-block p-4 bg-white rounded-xl border-2 mb-4" style={{ borderColor: entityColor }}>
              <QRCodeSVG 
                value={getPassUrl()} 
                size={200}
                level="H"
                fgColor={entityColor}
              />
            </div>
            <p className="text-sm text-slate-500 mb-4">Scan to access manager pass</p>
            <button
              onClick={() => setShowQrModal(false)}
              className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
