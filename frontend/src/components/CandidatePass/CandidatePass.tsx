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

  const entityColors: Record<string, { primary: string; secondary: string; accent: string }> = {
    'Baynunah Watergeneration Technologies': {
      primary: '#0066CC',
      secondary: '#E6F0FA',
      accent: '#003D7A'
    },
    'Baynunah Agriculture': {
      primary: '#228B22',
      secondary: '#E8F5E8',
      accent: '#145214'
    }
  }

  const getEntityStyle = () => {
    const entity = passData?.entity || 'Baynunah Watergeneration Technologies'
    return entityColors[entity] || entityColors['Baynunah Watergeneration Technologies']
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your pass...</p>
        </div>
      </div>
    )
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Error</h2>
          <p className="text-gray-600">{error || 'Unable to load pass data'}</p>
          {onBack && (
            <button onClick={onBack} className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Go Back
            </button>
          )}
        </div>
      </div>
    )
  }

  const entityStyle = getEntityStyle()
  const stageLabels: Record<string, string> = {
    applied: 'Applied',
    screening: 'Screening',
    assessment: 'Assessment',
    interview: 'Interview',
    offer: 'Offer',
    onboarding: 'Onboarding'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: entityStyle.secondary }}>
      {/* Header */}
      <header className="text-white p-6" style={{ backgroundColor: entityStyle.primary }}>
        <div className="max-w-4xl mx-auto">
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
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              {passData.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{passData.full_name}</h1>
              <p className="opacity-90">{passData.position_title}</p>
              <p className="text-sm opacity-70">{passData.entity || 'Baynunah Group'}</p>
            </div>
          </div>
          
          {/* Current Status Badge */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm font-medium">Stage: {stageLabels[passData.current_stage] || passData.current_stage}</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex">
          {[
            { id: 'journey', label: 'Journey', icon: '🎯' },
            { id: 'inbox', label: 'Inbox', icon: '📬', badge: passData.unread_messages },
            { id: 'calendar', label: 'Calendar', icon: '📅' },
            { id: 'contact', label: 'Contact HR', icon: '💬' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex-1 py-4 px-2 text-center text-sm font-medium relative transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === tab.id ? { borderColor: entityStyle.primary, color: entityStyle.primary } : {}}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
              {tab.badge ? (
                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        {activeTab === 'journey' && (
          <div className="space-y-6">
            {/* Journey Tracker */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Your Application Journey</h2>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  {passData.stages.map((stage, idx) => (
                    <div key={stage.name} className="relative flex items-start gap-4">
                      {/* Stage Indicator */}
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center z-10 transition-all ${
                          stage.status === 'completed'
                            ? 'text-white'
                            : stage.status === 'current'
                            ? 'ring-4 ring-offset-2'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        style={{
                          backgroundColor: stage.status === 'completed' || stage.status === 'current' ? entityStyle.primary : undefined,
                          ringColor: stage.status === 'current' ? entityStyle.secondary : undefined
                        }}
                      >
                        {stage.status === 'completed' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-bold">{idx + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 pb-2">
                        <h3 className={`font-medium ${stage.status === 'pending' ? 'text-gray-400' : 'text-gray-800'}`}>
                          {stageLabels[stage.name] || stage.name}
                        </h3>
                        {stage.status === 'current' && (
                          <p className="text-sm mt-1" style={{ color: entityStyle.primary }}>Currently here</p>
                        )}
                        {stage.status === 'completed' && stage.timestamp && (
                          <p className="text-sm text-gray-500 mt-1">{new Date(stage.timestamp).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Actions */}
            {passData.next_actions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">What's Next</h2>
                <div className="space-y-3">
                  {passData.next_actions.map(action => (
                    <button
                      key={action.action_id}
                      className="w-full p-4 rounded-lg border-2 border-dashed text-left hover:border-solid transition-all flex items-center gap-3"
                      style={{ borderColor: entityStyle.primary, color: entityStyle.primary }}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: entityStyle.secondary }}>
                        {action.type === 'form' && '📝'}
                        {action.type === 'upload' && '📎'}
                        {action.type === 'calendar' && '📅'}
                        {action.type === 'confirm' && '✓'}
                        {action.type === 'document' && '📄'}
                      </div>
                      <span className="font-medium">{action.label}</span>
                      <svg className="w-5 h-5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Slot Selection (if at interview stage) */}
            {passData.current_stage === 'interview' && !passData.booked_slot && passData.interview_slots.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Interview Time</h2>
                <p className="text-gray-600 text-sm mb-4">Choose a time slot that works for you:</p>
                <div className="grid gap-3">
                  {passData.interview_slots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedSlot === slot.id
                          ? 'border-solid'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={selectedSlot === slot.id ? { borderColor: entityStyle.primary, backgroundColor: entityStyle.secondary } : {}}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{new Date(slot.slot_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          <p className="text-sm text-gray-600">{slot.start_time} - {slot.end_time}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedSlot === slot.id ? 'border-current' : 'border-gray-300'}`} style={selectedSlot === slot.id ? { borderColor: entityStyle.primary } : {}}>
                          {selectedSlot === slot.id && (
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entityStyle.primary }}></div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedSlot && (
                  <button
                    onClick={bookSlot}
                    disabled={bookingLoading}
                    className="w-full mt-4 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: entityStyle.primary }}
                  >
                    {bookingLoading ? 'Booking...' : 'Book This Slot'}
                  </button>
                )}
              </div>
            )}

            {/* Booked Interview */}
            {passData.booked_slot && (
              <div className="bg-white rounded-xl shadow-sm p-6" style={{ borderLeft: `4px solid ${entityStyle.primary}` }}>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Interview</h2>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: entityStyle.secondary }}>
                    📅
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {new Date(passData.booked_slot.slot_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-gray-600">{passData.booked_slot.start_time} - {passData.booked_slot.end_time}</p>
                    {!passData.booked_slot.candidate_confirmed && (
                      <button
                        onClick={confirmSlot}
                        disabled={bookingLoading}
                        className="mt-3 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        style={{ backgroundColor: entityStyle.primary }}
                      >
                        {bookingLoading ? 'Confirming...' : 'Confirm Attendance'}
                      </button>
                    )}
                    {passData.booked_slot.candidate_confirmed && (
                      <span className="inline-flex items-center gap-1 mt-3 text-sm text-green-600 font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirmed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b" style={{ backgroundColor: entityStyle.secondary }}>
                <h2 className="font-semibold" style={{ color: entityStyle.primary }}>Messages</h2>
              </div>
              {inbox.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📬</div>
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {inbox.map(message => (
                    <div
                      key={message.id}
                      onClick={() => markMessageRead(message.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!message.is_read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: entityStyle.secondary }}>
                          {message.sender_type === 'hr' && '👤'}
                          {message.sender_type === 'system' && '🤖'}
                          {message.sender_type === 'manager' && '👔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium truncate ${!message.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {message.subject || 'No Subject'}
                            </p>
                            {!message.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{message.message_body}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(message.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Events</h2>
            {passData.booked_slot ? (
              <div className="p-4 rounded-lg" style={{ backgroundColor: entityStyle.secondary, borderLeft: `4px solid ${entityStyle.primary}` }}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📅</div>
                  <div>
                    <p className="font-semibold" style={{ color: entityStyle.accent }}>Interview Scheduled</p>
                    <p className="text-gray-700">
                      {new Date(passData.booked_slot.slot_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-sm text-gray-600">{passData.booked_slot.start_time} - {passData.booked_slot.end_time}</p>
                    <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${passData.booked_slot.candidate_confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {passData.booked_slot.candidate_confirmed ? 'Confirmed' : 'Pending Confirmation'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p>No upcoming events</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact HR</h2>
              <p className="text-gray-600 text-sm mb-6">Need help? Reach out to our HR team:</p>
              
              <div className="space-y-4">
                <a
                  href={`https://wa.me/${passData.hr_whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">WhatsApp</p>
                    <p className="text-sm text-gray-600">{passData.hr_whatsapp}</p>
                  </div>
                  <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <a
                  href={`mailto:${passData.hr_email}`}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ backgroundColor: entityStyle.secondary }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl" style={{ backgroundColor: entityStyle.primary }}>
                    ✉️
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Email</p>
                    <p className="text-sm text-gray-600">{passData.hr_email}</p>
                  </div>
                  <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>{passData.entity || 'Baynunah Group'} HR Portal</p>
      </footer>
    </div>
  )
}

export default CandidatePass
