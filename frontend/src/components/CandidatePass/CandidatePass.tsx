import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

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
  const [showProfile, setShowProfile] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  const API_URL = '/api'
  
  const getProfileUrl = () => {
    if (!passData) return ''
    return `${window.location.origin}/candidate-profile/${passData.candidate_id}?token=${passData.pass_token}`
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

  const getCalendarDays = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days: Array<{ date: number; dateStr: string; hasInterview: boolean; isToday: boolean }> = []
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: 0, dateStr: '', hasInterview: false, isToday: false })
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const hasInterview = passData.interview_slots.some(slot => slot.slot_date === dateStr) || 
                          (passData.booked_slot?.slot_date === dateStr)
      days.push({
        date: d,
        dateStr,
        hasInterview,
        isToday: d === today.getDate()
      })
    }
    
    return days
  }

  const getSelectedDateSlots = () => {
    if (!selectedCalendarDate) return []
    return passData.interview_slots.filter(slot => slot.slot_date === selectedCalendarDate)
  }

  const visibleActivityHistory = passData.activity_history.filter(entry => entry.visibility === 'candidate')

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ===== FIXED PASS SHELL (Single Container) ===== */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden flex flex-col" style={{ height: '85vh', maxHeight: '750px' }}>
          
          {/* === HEADER (Fixed) === */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button onClick={onBack} className="p-1 -ml-1 text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Candidate Pass</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {passData.unread_messages > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
                <span className="text-xs font-mono text-slate-400">{passData.pass_id}</span>
              </div>
            </div>
            
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-slate-800 mb-1 truncate">{passData.full_name}</h1>
                <p className="text-sm text-slate-500 truncate">{passData.position_title}</p>
                
                <div className="flex items-center gap-3 mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                    passData.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passData.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {passData.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{passData.candidate_number}</span>
                </div>
              </div>
              
              <div className="relative flex-shrink-0 ml-4">
                <a 
                  href={getProfileUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-20 h-20 bg-white rounded-xl border-2 border-slate-100 flex items-center justify-center shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
                  title="Click to open profile"
                >
                  <QRCodeSVG value={getProfileUrl()} size={60} level="M" />
                </a>
                <button 
                  onClick={() => setShowProfile(true)}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-700 transition-colors"
                  title="Expand QR"
                >
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* === STATS ROW (Fixed) === */}
          <div className="px-6 pb-4 grid grid-cols-4 gap-3 flex-shrink-0">
            {[
              { label: 'Stage', value: stageLabels[passData.current_stage.toLowerCase()]?.substring(0, 6) || passData.current_stage.substring(0, 6) },
              { label: 'Progress', value: `${currentStageIndex + 1}/5` },
              { label: 'Interviews', value: passData.booked_slot ? '1' : '0' },
              { label: 'Messages', value: passData.unread_messages }
            ].map(stat => (
              <div key={stat.label} className="bg-slate-50/80 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-lg font-semibold text-slate-800">{stat.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* === CONTENT AREA (Scrollable - Inside Pass) === */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <div className="space-y-4">
                {/* Journey Timeline */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Journey Progress</h3>
                  <div className="relative">
                    <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-800 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStageIndex / 4) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                      {['Application', 'Screening', 'Interview', 'Offer', 'Onboarding'].map((stage, idx) => {
                        const isCompleted = idx < currentStageIndex
                        const isCurrent = idx === currentStageIndex
                        return (
                          <div key={stage} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all shadow-sm ${
                              isCompleted ? 'bg-slate-800 border-slate-800 text-white' :
                              isCurrent ? 'bg-white border-slate-800 text-slate-800' :
                              'bg-slate-50 border-slate-200 text-slate-400'
                            }`}>
                              {isCompleted ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : idx + 1}
                            </div>
                            <span className={`text-[8px] font-semibold mt-1.5 ${isCurrent ? 'text-slate-800' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                              {stage.substring(0, 5)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Required */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Action Required</h3>
                  {primaryAction ? (
                    <button
                      onClick={handlePrimaryAction}
                      disabled={bookingLoading}
                      className="w-full p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl flex items-center justify-between transition-colors disabled:opacity-50"
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
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-slate-500">No pending actions</p>
                    </div>
                  )}
                </div>

                {/* Activity History (Static Read-Only) */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Activity History</h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                    {visibleActivityHistory.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No activity recorded yet</p>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {visibleActivityHistory.slice(0, 5).map(entry => (
                          <div key={entry.id} className="flex items-start gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></div>
                            <div>
                              <p className="text-slate-600">{entry.action_description}</p>
                              <p className="text-slate-400 text-[10px]">
                                {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div>
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Documents</h3>
                <div className="space-y-2">
                  {[
                    { name: 'Passport', status: 'pending' },
                    { name: 'Emirates ID', status: 'pending' },
                    { name: 'Visa Copy', status: 'pending' },
                    { name: 'Educational Certificates', status: 'pending' },
                    { name: 'Experience Letters', status: 'pending' }
                  ].map(doc => (
                    <div key={doc.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-700">{doc.name}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        doc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        doc.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CALENDAR TAB (Fixed Split View) */}
            {activeTab === 'calendar' && (
              <div className="flex gap-4 min-h-[280px]">
                {/* Left: Mini Calendar */}
                <div className="w-1/2 flex-shrink-0">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
                    {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-[9px] font-medium text-slate-400 pb-1">{d}</div>
                    ))}
                    {getCalendarDays().map((day, i) => (
                      <button
                        key={i}
                        onClick={() => day.date > 0 && setSelectedCalendarDate(day.dateStr)}
                        disabled={day.date === 0}
                        className={`aspect-square text-[10px] rounded-full flex items-center justify-center transition-all ${
                          day.date === 0 ? 'invisible' :
                          selectedCalendarDate === day.dateStr ? 'bg-slate-800 text-white' :
                          day.hasInterview ? 'bg-emerald-100 text-emerald-700 font-medium' :
                          day.isToday ? 'bg-slate-100 text-slate-800 font-medium' :
                          'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {day.date > 0 ? day.date : ''}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Right: Interview Details (Always Visible) */}
                <div className="w-1/2 flex-shrink-0">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Interview Details</h3>
                  {passData.booked_slot ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700">
                          {passData.booked_slot.candidate_confirmed ? 'Confirmed' : 'Booked'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        {new Date(passData.booked_slot.slot_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {passData.booked_slot.start_time.substring(0, 5)} - {passData.booked_slot.end_time.substring(0, 5)}
                      </p>
                      {!passData.booked_slot.candidate_confirmed && (
                        <button
                          onClick={confirmSlot}
                          disabled={bookingLoading}
                          className="mt-3 w-full py-2 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  ) : selectedCalendarDate && getSelectedDateSlots().length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 mb-2">Available:</p>
                      {getSelectedDateSlots().map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`w-full p-2 text-xs rounded-lg border transition-all ${
                            selectedSlot === slot.id
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                        </button>
                      ))}
                      {selectedSlot && (
                        <button
                          onClick={bookSlot}
                          disabled={bookingLoading}
                          className="w-full py-2 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
                        >
                          {bookingLoading ? 'Booking...' : 'Book Slot'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                      <svg className="w-10 h-10 text-slate-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-slate-400">
                        {selectedCalendarDate ? 'No slots' : 'Select date'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ENGAGE TAB */}
            {activeTab === 'engage' && (
              <div className="space-y-4">
                {/* Contact HR */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Contact HR</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://wa.me/${passData.hr_whatsapp?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">WhatsApp</p>
                        <p className="text-[10px] text-slate-400">Quick Message</p>
                      </div>
                    </a>
                    <a
                      href={`mailto:${passData.hr_email}`}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">Email</p>
                        <p className="text-[10px] text-slate-400">Send Email</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Submit Feedback */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Submit Feedback</h3>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your feedback or ask a question..."
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-slate-400 bg-white"
                    rows={3}
                  />
                  <button
                    disabled={!feedbackText.trim()}
                    className="mt-2 w-full py-2.5 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50"
                  >
                    Send Feedback
                  </button>
                </div>

                {/* Communications History */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Communications</h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                    {passData.unread_messages > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-xs">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-[10px] font-bold">HR</span>
                          </div>
                          <div>
                            <p className="text-slate-600">You have {passData.unread_messages} unread message(s)</p>
                            <p className="text-slate-400 text-[10px]">Check your inbox</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No messages yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* === BOTTOM MENU (Fixed) === */}
          <div className="border-t border-slate-100 px-2 flex-shrink-0">
            <div className="flex">
              {[
                { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { id: 'documents', label: 'Docs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'engage', label: 'Engage', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex-1 py-3 flex flex-col items-center gap-1 relative transition-colors ${
                    activeTab === tab.id ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  <span className="text-[10px]">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-slate-800 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== PROFILE MODAL ===== */}
        {showProfile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Candidate Profile</h3>
                <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-lg">
                    <QRCodeSVG value={getProfileUrl()} size={160} level="H" includeMargin={true} />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-slate-900">{passData.full_name}</h2>
                  <p className="text-sm text-slate-500">{passData.position_title}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{passData.candidate_number}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-700 text-center">Scan this QR code to access the candidate profile</p>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
                <button onClick={() => setShowProfile(false)} className="w-full py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
