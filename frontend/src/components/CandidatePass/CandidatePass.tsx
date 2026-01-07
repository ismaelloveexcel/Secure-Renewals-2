import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  BasePassContainer, 
  ActionRequired,
  JourneyTimeline,
  ActivityHistory,
  PassTab,
  CANDIDATE_STAGES,
  getStageIndex,
  getCandidateActionRequired
} from '../BasePass'

interface ActivityLogEntry {
  id: number
  candidate_id: number
  stage: string
  action_type: string
  action_description: string
  performed_by: string
  timestamp: string
  visibility: string
}

interface CandidatePassData {
  pass_id: string
  pass_token: string
  candidate_id: number
  candidate_number: string
  full_name: string
  email: string
  phone: string | null
  position_title: string
  position_id: number
  entity: string | null
  current_stage: string
  status: string
  stages: Array<{ name: string; status: string; timestamp: string | null }>
  interview_slots: Array<InterviewSlot>
  booked_slot: InterviewSlot | null
  unread_messages: number
  next_actions: Array<{ action_id: string; label: string; type: string }>
  activity_history: ActivityLogEntry[]
  hr_whatsapp: string
  hr_email: string
}

interface InterviewSlot {
  id: number
  slot_date: string
  start_time: string
  end_time: string
  round_number: number
  status: string
  candidate_confirmed: boolean
}

type ActiveTab = 'home' | 'documents' | 'calendar' | 'engage'

interface CandidatePassProps {
  candidateId: number
  token: string
  onBack?: () => void
}

const CANDIDATE_TABS: PassTab[] = [
  { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'documents', label: 'Documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'engage', label: 'Engage', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

export function CandidatePass({ candidateId, token, onBack }: CandidatePassProps) {
  const [passData, setPassData] = useState<CandidatePassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('home')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const API_URL = '/api'
  
  const getProfileUrl = () => {
    if (!passData) return ''
    return `${window.location.origin}/candidate-profile/${passData.candidate_id}?token=${passData.pass_token}`
  }

  const getEntityColor = () => {
    return passData?.entity?.includes('Agriculture') ? '#00bf63' : '#00B0F0'
  }

  useEffect(() => {
    fetchPassData()
  }, [candidateId])

  const fetchPassData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/interview/pass/candidate/${candidateId}`, {
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

  const bookSlot = async () => {
    if (!selectedSlot || !passData) return
    setBookingLoading(true)
    try {
      const response = await fetch(`${API_URL}/interview/slots/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slot_id: selectedSlot,
          candidate_id: passData.candidate_id
        })
      })
      if (!response.ok) throw new Error('Failed to book slot')
      await fetchPassData()
      setSelectedSlot(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  const confirmSlot = async () => {
    if (!passData?.booked_slot) return
    setBookingLoading(true)
    try {
      const response = await fetch(`${API_URL}/interview/slots/confirm?candidate_id=${passData.candidate_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ slot_id: passData.booked_slot.id })
      })
      if (!response.ok) throw new Error('Failed to confirm slot')
      await fetchPassData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Confirmation failed')
    } finally {
      setBookingLoading(false)
    }
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
        <div className="bg-white/80 backdrop-blur-md border border-white/40 shadow-lg rounded-2xl p-6 max-w-sm text-center">
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
    application: 'Application',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    onboarding: 'Onboarding'
  }

  const stageStatuses: Record<string, Record<string, string>> = {
    application: {
      submitted: 'Submitted',
      incomplete: 'Incomplete',
      received: 'Received',
      applied: 'Applied'
    },
    screening: {
      under_screening: 'Under Screening',
      shortlisted: 'Shortlisted',
      on_hold: 'On Hold',
      rejected: 'Rejected'
    },
    interview: {
      scheduled: 'Scheduled',
      completed: 'Completed',
      pending_feedback: 'Pending Feedback',
      rejected: 'Rejected'
    },
    offer: {
      in_preparation: 'In Preparation',
      sent: 'Sent',
      accepted: 'Accepted',
      declined: 'Declined'
    },
    onboarding: {
      initiated: 'Initiated',
      documents_pending: 'Documents Pending',
      completed: 'Completed'
    }
  }

  const getStatusLabel = (stage: string, status: string): string => {
    const stageKey = stage.toLowerCase()
    const statusKey = status.toLowerCase().replace(/[\s-]/g, '_')
    return stageStatuses[stageKey]?.[statusKey] || status
  }

  const currentStageIndex = getStageIndex(CANDIDATE_STAGES, passData.current_stage)
  const primaryAction = passData.next_actions.length > 0 ? passData.next_actions[0] : null

  const handlePrimaryAction = () => {
    if (!primaryAction) return
    switch (primaryAction.action_id) {
      case 'complete_profile':
      case 'upload_documents':
      case 'review_offer':
        setActiveTab('documents')
        break
      case 'book_interview':
        setActiveTab('calendar')
        break
      case 'confirm_interview':
        confirmSlot()
        break
    }
  }

  const actionRequiredConfig = primaryAction ? {
    label: primaryAction.label,
    description: primaryAction.type === 'required' ? 'Required action' : 'Recommended',
    onClick: handlePrimaryAction,
    loading: bookingLoading
  } : null

  const activityItems = passData.activity_history.map(entry => ({
    id: entry.id,
    action_type: entry.action_type,
    action_description: entry.action_description,
    performed_by: entry.performed_by,
    timestamp: entry.timestamp,
    stage: entry.stage
  }))

  const renderHeader = () => (
    <div className="px-4 pt-3 pb-2 flex-shrink-0 bg-gradient-to-b from-white to-transparent">
      <div className="flex items-center justify-between mb-0.5">
        <img src="/assets/logo.png" alt="Baynunah" className="h-4 w-auto" />
        <div className="flex items-center gap-1.5">
          <button className="relative p-1.5 rounded-full hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {passData.unread_messages > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            passData.status === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
          }`}>Active</span>
        </div>
      </div>
      <span className="text-base font-bold text-slate-500">Candidate Pass</span>
      
      {/* Candidate Info Card */}
      <div className="mt-2">
        <div 
          className="p-3 bg-white rounded-xl border-[3px] shadow-md"
          style={{ borderColor: getEntityColor() }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black text-slate-900 leading-tight truncate tracking-tight">{passData.full_name}</h2>
              <p className="text-[11px] text-slate-600 truncate font-semibold">{passData.position_title}</p>
              <div className="inline-block mt-1 px-1.5 py-0.5 bg-emerald-50 rounded">
                <p className="text-[9px] text-emerald-700 font-mono font-bold tracking-wider">{passData.candidate_number}</p>
              </div>
            </div>
            <div className="relative flex-shrink-0 ml-2">
              <a 
                href={getProfileUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-16 h-16 bg-white rounded-lg border-2 flex items-center justify-center shadow hover:shadow-md transition-all cursor-pointer active:scale-95 group"
                style={{ borderColor: getEntityColor() }}
                title="Click to open profile"
              >
                <QRCodeSVG 
                  value={getProfileUrl()} 
                  size={48}
                  level="M"
                  fgColor={getEntityColor()}
                  className="group-hover:scale-105 transition-transform"
                />
              </a>
              <button 
                onClick={() => setShowProfile(true)}
                className="absolute -bottom-1 -right-1 w-5 h-5 text-white rounded-full flex items-center justify-center shadow hover:opacity-90 transition-colors"
                style={{ backgroundColor: getEntityColor() }}
                title="Expand QR code"
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex pt-2 border-t border-slate-100">
            <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)] animate-pulse"></div>
                <p className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Stage</p>
              </div>
              <p className="text-[11px] font-semibold text-slate-700">{stageLabels[passData.current_stage.toLowerCase()] || passData.current_stage}</p>
            </div>
            <div className="w-px bg-slate-200 self-stretch my-0.5"></div>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]"></div>
                <p className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Status</p>
              </div>
              <p className="text-[10px] font-semibold text-slate-700 leading-tight">{getStatusLabel(passData.current_stage, passData.status)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderJourney = () => (
    <div className="mx-3 mb-2 flex-shrink-0">
      <JourneyTimeline 
        stages={CANDIDATE_STAGES}
        currentStageIndex={currentStageIndex}
        entityColor={getEntityColor()}
      />
    </div>
  )

  const renderActionRequired = () => (
    activeTab === 'home' ? (
      <div className="mx-3 mb-2">
        <ActionRequired action={actionRequiredConfig} entityColor={getEntityColor()} />
      </div>
    ) : null
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="px-4 space-y-3">
            {activityItems.length > 0 ? (
              <ActivityHistory activities={activityItems} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">You're all caught up!</h3>
                <p className="text-xs text-slate-400">No pending actions at this time</p>
              </div>
            )}
          </div>
        )

      case 'documents':
        return (
          <div className="px-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Inbox</h3>
                <p className="text-[10px] text-slate-400">Messages and documents</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2">
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Upload Section */}
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center bg-slate-50/50">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-600 mb-1">Upload Documents</p>
              <p className="text-[10px] text-slate-400">Drag & drop or click to browse</p>
              <button className="mt-3 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                Choose File
              </button>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-700">Welcome Message</span>
                  <span className="text-[9px] text-slate-400">Today</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">Thank you for your application. We're excited to review your profile!</p>
              </div>
            </div>
          </div>
        )

      case 'calendar':
        return (
          <div className="px-4">
            <div className="grid grid-cols-2 gap-3 h-full">
              {/* LEFT: Calendar Grid */}
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
                    const isToday = day === new Date().getDate()
                    const hasSlot = passData.interview_slots.some(s => new Date(s.slot_date).getDate() === day)
                    const isBooked = passData.booked_slot && new Date(passData.booked_slot.slot_date).getDate() === day
                    return (
                      <div 
                        key={i} 
                        className={`text-[10px] py-1 rounded-md cursor-pointer transition-colors ${
                          isBooked ? 'bg-emerald-500 text-white font-bold' :
                          hasSlot ? 'bg-blue-100 text-blue-700 font-medium' :
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
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-[8px] text-slate-400">Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[8px] text-slate-400">Booked</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Slot Selection */}
              <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Interview Slots</h4>
                    <p className="text-[9px] text-slate-400">
                      {passData.booked_slot ? 'Your interview' : `${passData.interview_slots.length} available`}
                    </p>
                  </div>
                </div>

                {passData.booked_slot ? (
                  <div className="flex-1 flex flex-col">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-emerald-800">
                          {passData.booked_slot.candidate_confirmed ? 'Confirmed' : 'Booked'}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-700">
                        {new Date(passData.booked_slot.slot_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {passData.booked_slot.start_time.substring(0, 5)} - {passData.booked_slot.end_time.substring(0, 5)}
                      </p>
                    </div>
                    {!passData.booked_slot.candidate_confirmed && (
                      <button
                        onClick={confirmSlot}
                        disabled={bookingLoading}
                        className="mt-auto py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {bookingLoading ? 'Confirming...' : 'Confirm Attendance'}
                      </button>
                    )}
                  </div>
                ) : passData.interview_slots.length > 0 ? (
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-32">
                      {passData.interview_slots.slice(0, 4).map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`w-full p-2 rounded-lg text-left transition-all ${
                            selectedSlot === slot.id 
                              ? 'bg-blue-50 border-2 border-blue-400' 
                              : 'bg-slate-50 border border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <p className="text-[10px] font-medium text-slate-700">
                            {new Date(slot.slot_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-[9px] text-slate-500">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={bookSlot}
                      disabled={!selectedSlot || bookingLoading}
                      className="mt-2 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bookingLoading ? 'Booking...' : 'Book Selected Slot'}
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">No slots available</p>
                    <p className="text-[9px] text-slate-400">Check back later</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'engage':
        return (
          <div className="px-4 space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Contact HR</p>
            {[
              { label: 'Email HR', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', action: () => window.location.href = `mailto:${passData.hr_email}` },
              { label: 'WhatsApp HR', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', action: () => window.open(`https://wa.me/${passData.hr_whatsapp}`, '_blank') },
              { label: 'Request Callback', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', action: () => {} }
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
    <>
      <BasePassContainer
        entityColor={getEntityColor()}
        header={renderHeader()}
        journey={renderJourney()}
        actionRequired={renderActionRequired()}
        tabs={CANDIDATE_TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      >
        {renderContent()}
      </BasePassContainer>

      {/* QR Code Modal */}
      {showProfile && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProfile(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Scan to View Profile</h3>
            <div className="mx-auto w-fit p-4 bg-white rounded-xl border-2" style={{ borderColor: getEntityColor() }}>
              <QRCodeSVG 
                value={getProfileUrl()} 
                size={180}
                level="H"
                fgColor={getEntityColor()}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-3 font-mono break-all">{passData.candidate_number}</p>
            <button
              onClick={() => setShowProfile(false)}
              className="mt-4 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
