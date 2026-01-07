import { useState, useEffect } from 'react'

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

interface InboxMessage {
  id: number
  subject: string | null
  message_body: string | null
  message_type: string
  is_read: boolean
  created_at: string
  sender_type: string
}

type ActiveTab = 'journey' | 'inbox' | 'calendar' | 'contact'

interface CandidatePassProps {
  candidateId: number
  token: string
  onBack?: () => void
}

export function CandidatePass({ candidateId, token, onBack }: CandidatePassProps) {
  const [passData, setPassData] = useState<CandidatePassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('journey')
  const [inbox, setInbox] = useState<InboxMessage[]>([])
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)

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
      await fetchInbox(data.candidate_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pass')
    } finally {
      setLoading(false)
    }
  }

  const fetchInbox = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/interview/messages/candidate/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setInbox(data)
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err)
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

  const markMessageRead = async (messageId: number) => {
    try {
      await fetch(`${API_URL}/interview/messages/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setInbox(inbox.map(m => m.id === messageId ? { ...m, is_read: true } : m))
    } catch (err) {
      console.error('Failed to mark message read:', err)
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

  const statusLabels: Record<string, string> = {
    // Application
    submitted: 'Submitted',
    incomplete: 'Incomplete',
    withdrawn: 'Withdrawn',
    received: 'Application Received',
    // Screening
    under_screening: 'Under Screening',
    shortlisted: 'Shortlisted',
    on_hold: 'On Hold',
    rejected_screening: 'Rejected at Screening',
    // Interview
    interview_scheduled: 'Interview Scheduled',
    interview_completed: 'Interview Completed',
    second_interview: 'Second Interview Required',
    pending_feedback: 'Pending Interview Feedback',
    rejected_interview: 'Rejected After Interview',
    // Offer
    offer_preparation: 'Offer In Preparation',
    offer_sent: 'Offer Sent',
    offer_accepted: 'Offer Accepted',
    offer_declined: 'Offer Declined',
    offer_expired: 'Offer Expired',
    offer_withdrawn: 'Offer Withdrawn',
    // Onboarding
    onboarding_initiated: 'Onboarding Initiated',
    documents_pending: 'Documents Pending',
    clearance_in_progress: 'Background / Clearance in Progress',
    onboarding_completed: 'Onboarding Completed',
    no_show: 'No Show / Onboarding Failed'
  }

  const getStageIndex = (stageName: string) => {
    const stages = ['Application', 'Screening', 'Interview', 'Offer', 'Onboarding']
    // Case-insensitive search
    return stages.findIndex(s => s.toLowerCase() === stageName.toLowerCase())
  }

  const currentStageIndex = getStageIndex(passData.current_stage)

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Pass Card */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <img src="/assets/logo.png" alt="Baynunah" className="h-5 w-auto" />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="relative">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {passData.unread_messages > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="text-lg font-bold text-slate-500 tracking-tight">Candidate Pass</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                passData.status === 'revoked' || new Date(passData.valid_until) < new Date() 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {new Date(passData.valid_until) < new Date() ? 'Expired' : passData.status === 'revoked' ? 'Revoked' : 'Active'}
              </span>
            </div>
          </div>

          {/* Candidate Info Card */}
          <div 
            className="mx-4 mb-4 p-4 bg-slate-50/80 rounded-2xl border-4 flex items-center justify-between"
            style={{ borderColor: passData.entity?.includes('Agriculture') ? '#00bf63' : '#00B0F0' }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Candidate Journey</p>
              <h2 className="text-xl font-semibold text-slate-800 mb-0.5">{passData.full_name}</h2>
              <p className="text-sm text-slate-500 mb-2">{passData.position_title}</p>
              <p className="text-xs text-emerald-600 font-mono">{passData.candidate_number}</p>
            </div>
            <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-12 h-12 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-3 0h1v1h-1v-1zm3 3h1v1h-1v-1zm-3 0h1v1h-1v-1zm3 3h1v1h-1v-1zm-3 0h1v1h-1v-1z"/>
              </svg>
            </div>
          </div>

          {/* Status Row */}
          <div className="mx-4 mb-4 flex gap-4">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Current Stage</p>
              <p className="text-sm font-medium text-slate-800">
                {passData.current_stage}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Status</p>
              <p className="text-sm font-medium text-slate-800">
                {passData.status}
              </p>
            </div>
          </div>

          {/* Journey Progress Bar */}
          <div className="mx-4 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-4">Journey</p>
            <div className="relative">
              {/* Connection Lines */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-100 -z-0">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${(currentStageIndex / 4) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between relative z-10">
                {[
                  { id: 'Application', label: 'Application', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { id: 'Screening', label: 'Screening', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                  { id: 'Interview', label: 'Interview', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                  { id: 'Offer', label: 'Offer', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { id: 'Onboarding', label: 'Onboarding', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
                ].map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex
                  const isCurrent = idx === currentStageIndex
                  return (
                    <div key={stage.id} className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                        isCompleted || isCurrent
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={stage.icon} />
                        </svg>
                      </div>
                      <span className={`text-[8px] font-medium mt-2 whitespace-nowrap ${
                        isCompleted || isCurrent ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {stage.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Next Action Section */}
          <div className="mx-4 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Next Action</p>
                <button 
                  onClick={() => setActiveTab('journey')}
                  className="w-full p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Complete Profile</p>
                    </div>
                  </div>
                </button>
          </div>

          {/* Interview Info */}
          {passData.booked_slot && (
            <div className="mx-4 mb-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Linked</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(passData.booked_slot.slot_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} · {passData.booked_slot.start_time.substring(0, 5)}
                  </p>
                  {passData.booked_slot.candidate_confirmed ? (
                    <span className="text-xs text-emerald-600">Confirmed</span>
                  ) : (
                    <span className="text-xs text-amber-600">Pending confirmation</span>
                  )}
                </div>
                <button className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Manage
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="border-t border-slate-100 px-2">
            <div className="flex">
              {[
                { id: 'journey', label: 'Journey', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                )},
                { id: 'inbox', label: 'Inbox', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ), badge: passData.unread_messages },
                { id: 'calendar', label: 'Calendar', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )},
                { id: 'contact', label: 'Contact', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex-1 py-3 flex flex-col items-center gap-1 relative transition-colors ${
                    activeTab === tab.id ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px]">{tab.label}</span>
                  {tab.badge ? (
                    <span className="absolute top-2 right-1/4 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  ) : null}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-slate-800 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4 bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-2xl p-4 max-h-64 overflow-y-auto">
          {activeTab === 'journey' && (
            <div className="space-y-4">
              {/* Profile Completion Status */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Profile Setup</span>
                  <span className="text-xs font-bold text-emerald-700">65%</span>
                </div>
                <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-[10px] text-emerald-600 mt-2">Finish uploading your EID and Passport to proceed to Screening.</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-slate-600">Personal Details</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-slate-600">Documents</span>
                </button>
              </div>

              {/* Interview Slot Selection */}
              {passData.current_stage === 'interview' && !passData.booked_slot && passData.interview_slots.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Select Interview Slot</h3>
                  <div className="space-y-2">
                    {passData.interview_slots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          selectedSlot === slot.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{new Date(slot.slot_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                            <p className="text-xs text-slate-500">{slot.start_time} - {slot.end_time}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedSlot === slot.id ? 'border-emerald-500' : 'border-slate-300'
                          }`}>
                            {selectedSlot === slot.id && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedSlot && (
                    <button
                      onClick={bookSlot}
                      disabled={bookingLoading}
                      className="w-full mt-3 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      {bookingLoading ? 'Booking...' : 'Book Slot'}
                    </button>
                  )}
                </div>
              )}

              {/* Confirm Interview */}
              {passData.booked_slot && !passData.booked_slot.candidate_confirmed && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={confirmSlot}
                    disabled={bookingLoading}
                    className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {bookingLoading ? 'Confirming...' : 'Confirm Interview Attendance'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest">Messages</h3>
              {inbox.length > 0 ? (
                inbox.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => !msg.is_read && markMessageRead(msg.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-colors ${
                      msg.is_read ? 'border-slate-100 bg-slate-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${msg.is_read ? 'bg-slate-300' : 'bg-emerald-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${msg.is_read ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                          {msg.subject || 'No subject'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{msg.message_body?.substring(0, 50) || 'No content'}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(msg.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">No messages</p>
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest">Scheduled Events</h3>
              {passData.booked_slot ? (
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Interview</p>
                      <p className="text-xs text-slate-500">
                        {new Date(passData.booked_slot.slot_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-xs text-slate-500">{passData.booked_slot.start_time} - {passData.booked_slot.end_time}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No scheduled events</p>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest">Contact HR</h3>
              <a
                href={`https://wa.me/${passData.hr_whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">WhatsApp</p>
                  <p className="text-xs text-slate-500">{passData.hr_whatsapp}</p>
                </div>
              </a>
              <a
                href={`mailto:${passData.hr_email}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Email</p>
                  <p className="text-xs text-slate-500">{passData.hr_email}</p>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
