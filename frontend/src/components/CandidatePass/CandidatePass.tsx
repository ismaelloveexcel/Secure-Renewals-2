import { useState, useEffect } from 'react'

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

export function CandidatePass({ candidateId, token, onBack }: CandidatePassProps) {
  const [passData, setPassData] = useState<CandidatePassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('home')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  const API_URL = '/api'

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

  const getStageIndex = (stageName: string) => {
    const stages = ['Application', 'Screening', 'Interview', 'Offer', 'Onboarding']
    return stages.findIndex(s => s.toLowerCase() === stageName.toLowerCase())
  }

  const currentStageIndex = getStageIndex(passData.current_stage)
  const primaryAction = passData.next_actions.length > 0 ? passData.next_actions[0] : null

  const handlePrimaryAction = () => {
    if (!primaryAction) return
    switch (primaryAction.action_id) {
      case 'complete_profile':
        setActiveTab('documents')
        break
      case 'upload_documents':
        setActiveTab('documents')
        break
      case 'book_interview':
        setActiveTab('calendar')
        break
      case 'confirm_interview':
        confirmSlot()
        break
      case 'review_offer':
        setActiveTab('documents')
        break
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* FIXED SHELL - Pass Card Container */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden flex flex-col" style={{ height: '85vh', maxHeight: '700px' }}>
          
          {/* ===== HEADER (Fixed) ===== */}
          <div className="px-5 pt-5 pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <img src="/assets/logo.png" alt="Baynunah" className="h-5 w-auto" />
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                passData.status === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>Active</span>
            </div>
            <span className="text-lg font-bold text-slate-500">Candidate Pass</span>
          </div>

          {/* ===== CANDIDATE INFO CARD (Fixed) ===== */}
          <div 
            className="mx-4 mb-3 p-3 bg-slate-50/80 rounded-xl border-4 flex-shrink-0"
            style={{ borderColor: passData.entity?.includes('Agriculture') ? '#00bf63' : '#00B0F0' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Candidate</p>
                <h2 className="text-base font-semibold text-slate-800 leading-tight truncate">{passData.full_name}</h2>
                <p className="text-xs text-slate-500 truncate">{passData.position_title}</p>
                <p className="text-[10px] text-emerald-600 font-mono mt-0.5">{passData.candidate_number}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5z"/>
                </svg>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-200/60">
              <div className="flex-1 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                <div>
                  <p className="text-[8px] uppercase text-slate-400 leading-none">Stage</p>
                  <p className="text-[11px] font-medium text-slate-800 leading-tight">{stageLabels[passData.current_stage.toLowerCase()] || passData.current_stage}</p>
                </div>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div className="flex-1 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <div>
                  <p className="text-[8px] uppercase text-slate-400 leading-none">Status</p>
                  <p className="text-[11px] font-medium text-slate-800 leading-tight capitalize">{passData.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== JOURNEY TIMELINE (Fixed) ===== */}
          <div className="mx-4 mb-3 flex-shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2">Journey</p>
            <div className="relative">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-100">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(currentStageIndex / 4) * 100}%` }}></div>
              </div>
              <div className="flex items-center justify-between relative z-10">
                {['Application', 'Screening', 'Interview', 'Offer', 'Onboarding'].map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex
                  const isCurrent = idx === currentStageIndex
                  return (
                    <div key={stage} className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                        isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                        isCurrent ? 'bg-emerald-50 border-emerald-500 text-emerald-600' :
                        'bg-slate-100 border-slate-200 text-slate-400'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[7px] font-medium mt-1 ${isCurrent || isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                        {stage.substring(0, 5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ===== NEXT ACTION (Always visible) ===== */}
          <div className="mx-4 mb-3 flex-shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2">Next Action</p>
            {primaryAction ? (
              <button
                onClick={handlePrimaryAction}
                disabled={bookingLoading}
                className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-between transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">{primaryAction.label}</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Required</span>
              </button>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-slate-500">No pending actions</span>
                </div>
              </div>
            )}
          </div>

          {/* ===== CONTENT AREA (Scrollable - Swaps by activeTab) ===== */}
          <div className="flex-1 overflow-y-auto mx-4 mb-2">
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <div className="space-y-3">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setActiveTab('documents')} className="p-3 bg-slate-50 rounded-xl text-center hover:bg-slate-100 transition-colors">
                    <svg className="w-5 h-5 mx-auto mb-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-[10px] text-slate-600">Documents</span>
                  </button>
                  <button onClick={() => setActiveTab('calendar')} className="p-3 bg-slate-50 rounded-xl text-center hover:bg-slate-100 transition-colors">
                    <svg className="w-5 h-5 mx-auto mb-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] text-slate-600">Calendar</span>
                  </button>
                </div>

                {/* Activity History (Collapsed) */}
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setHistoryExpanded(!historyExpanded)}
                    className="w-full p-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-600">Activity History</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${historyExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {historyExpanded && (
                    <div className="p-3 bg-white max-h-40 overflow-y-auto">
                      {passData.activity_history.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">No activity yet</p>
                      ) : (
                        <div className="space-y-2">
                          {passData.activity_history.map(entry => (
                            <div key={entry.id} className="flex items-start gap-2 text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></div>
                              <div>
                                <p className="text-slate-700">{entry.action_description}</p>
                                <p className="text-slate-400 text-[10px]">
                                  {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2">Required Documents</p>
                {['Passport', 'Emirates ID', 'Visa', 'Educational Certificates'].map(doc => (
                  <div key={doc} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs text-slate-700">{doc}</span>
                    </div>
                    <button className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* CALENDAR TAB (Split View) */}
            {activeTab === 'calendar' && (
              <div className="flex flex-col h-full">
                {/* Left: Mini Calendar */}
                <div className="mb-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2">Calendar</p>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-[8px] text-slate-400 font-medium py-1">{d}</div>
                    ))}
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 3
                      const hasInterview = passData.booked_slot && new Date(passData.booked_slot.slot_date).getDate() === day
                      const hasSlot = passData.interview_slots.some(s => new Date(s.slot_date).getDate() === day)
                      return (
                        <div 
                          key={i} 
                          className={`text-[10px] py-1 rounded ${
                            hasInterview ? 'bg-emerald-500 text-white font-bold' :
                            hasSlot ? 'bg-emerald-100 text-emerald-700' :
                            day > 0 && day <= 31 ? 'text-slate-600' : 'text-slate-300'
                          }`}
                        >
                          {day > 0 && day <= 31 ? day : ''}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right: Interview Details */}
                <div className="flex-1">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2">Interview Details</p>
                  {passData.booked_slot ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-sm font-semibold text-emerald-800">Interview Scheduled</p>
                      <div className="mt-2 space-y-1 text-xs text-emerald-700">
                        <p><strong>Date:</strong> {new Date(passData.booked_slot.slot_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <p><strong>Time:</strong> {passData.booked_slot.start_time.substring(0, 5)} - {passData.booked_slot.end_time.substring(0, 5)}</p>
                        <p><strong>Mode:</strong> Online</p>
                        <p><strong>Status:</strong> {passData.booked_slot.candidate_confirmed ? 'Confirmed' : 'Pending Confirmation'}</p>
                      </div>
                      {!passData.booked_slot.candidate_confirmed && (
                        <button 
                          onClick={confirmSlot}
                          disabled={bookingLoading}
                          className="mt-3 w-full py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {bookingLoading ? 'Confirming...' : 'Confirm Interview'}
                        </button>
                      )}
                    </div>
                  ) : passData.interview_slots.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 mb-2">Select an available slot:</p>
                      {passData.interview_slots.slice(0, 4).map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all ${
                            selectedSlot === slot.id ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <p className="text-xs font-medium text-slate-700">
                            {new Date(slot.slot_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-[10px] text-slate-400">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</p>
                        </button>
                      ))}
                      <button 
                        onClick={bookSlot}
                        disabled={!selectedSlot || bookingLoading}
                        className="w-full mt-2 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl disabled:opacity-50 hover:bg-slate-900 transition-colors"
                      >
                        {bookingLoading ? 'Booking...' : 'Book Selected Slot'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400">No interview scheduled yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ENGAGE TAB */}
            {activeTab === 'engage' && (
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2">Get in Touch</p>
                {[
                  { label: 'Contact HR', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', action: () => window.location.href = `mailto:${passData.hr_email}` },
                  { label: 'WhatsApp HR', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', action: () => window.open(`https://wa.me/${passData.hr_whatsapp}`, '_blank') },
                  { label: 'Give Feedback', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', action: () => {} },
                  { label: 'Ask a Question', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', action: () => {} }
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
            )}
          </div>

          {/* ===== BOTTOM MENU (Fixed) ===== */}
          <div className="border-t border-slate-100 px-2 py-1 flex-shrink-0">
            <div className="flex">
              {[
                { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { id: 'documents', label: 'Docs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'engage', label: 'Engage', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: passData.unread_messages }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex-1 py-2 flex flex-col items-center gap-0.5 relative transition-colors ${
                    activeTab === tab.id ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  <span className="text-[9px]">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-slate-800 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
