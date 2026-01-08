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
  getStageLabel,
  getStatusLabel
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
  department?: string
  recruitment_request_number?: string
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
  current_location?: string
  visa_status?: string
  notice_period_days?: number
  expected_salary?: number
  details_confirmed?: boolean
}

interface CandidateDetailsForm {
  phone: string
  email: string
  location: string
  visa_status: string
  notice_period: string
  expected_salary: string
  confirmed: boolean
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

const UAE_LOCATIONS = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
  'Al Ain',
  'Other UAE',
  'Outside UAE'
]

const VISA_STATUSES = [
  'Residence Visa',
  'Visit Visa',
  'Employment Visa',
  'Tourist Visa',
  'Golden Visa',
  'Student Visa',
  'Freelance Visa',
  'No Visa Required',
  'Other'
]

const NOTICE_PERIODS = [
  'Immediate',
  '1 Week',
  '2 Weeks',
  '1 Month',
  '2 Months',
  '3 Months',
  'Other'
]

export function CandidatePass({ candidateId, token, onBack }: CandidatePassProps) {
  const [passData, setPassData] = useState<CandidatePassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('home')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsForm, setDetailsForm] = useState<CandidateDetailsForm>({
    phone: '',
    email: '',
    location: '',
    visa_status: '',
    notice_period: '',
    expected_salary: '',
    confirmed: false
  })
  const [savingDetails, setSavingDetails] = useState(false)

  const API_URL = '/api'
  
  const getProfileUrl = () => {
    if (!passData) return ''
    return `${window.location.origin}/candidate-profile/${passData.candidate_id}?token=${passData.pass_token}`
  }

  const getEntityColor = () => {
    return passData?.entity?.includes('Agriculture') ? '#00bf63' : '#00B0F0'
  }

  const getEntityName = () => {
    if (!passData?.entity) return 'Baynunah Group'
    if (passData.entity.includes('Agriculture')) return 'Agriculture Division'
    if (passData.entity.includes('Water')) return 'Watergeneration'
    return passData.entity
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 409) {
          alert(errorData.detail || 'This slot is no longer available. Please select another time.')
          await fetchPassData()
          setSelectedSlot(null)
          return
        }
        throw new Error(errorData.detail || 'Failed to book slot')
      }
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

  const openDetailsModal = () => {
    if (passData) {
      const noticePeriodMap: Record<number, string> = {
        0: 'Immediate',
        7: '1 Week',
        14: '2 Weeks',
        30: '1 Month',
        60: '2 Months',
        90: '3 Months'
      }
      setDetailsForm({
        phone: passData.phone || '',
        email: passData.email || '',
        location: passData.current_location || '',
        visa_status: passData.visa_status || '',
        notice_period: passData.notice_period_days !== undefined ? (noticePeriodMap[passData.notice_period_days] || 'Other') : '',
        expected_salary: passData.expected_salary?.toString() || '',
        confirmed: passData.details_confirmed || false
      })
    }
    setShowDetailsModal(true)
  }

  const saveDetails = async () => {
    if (!passData || !detailsForm.confirmed) return
    setSavingDetails(true)
    try {
      const noticePeriodDays: Record<string, number> = {
        'Immediate': 0,
        '1 Week': 7,
        '2 Weeks': 14,
        '1 Month': 30,
        '2 Months': 60,
        '3 Months': 90,
        'Other': 30
      }
      const response = await fetch(`${API_URL}/recruitment/candidates/${passData.candidate_id}/self-service-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pass_token: passData.pass_token,
          phone: detailsForm.phone,
          email: detailsForm.email,
          current_location: detailsForm.location,
          visa_status: detailsForm.visa_status,
          notice_period_days: noticePeriodDays[detailsForm.notice_period] ?? 30,
          expected_salary: parseFloat(detailsForm.expected_salary) || null,
          details_confirmed: true
        })
      })
      if (!response.ok) throw new Error('Failed to save details')
      await fetchPassData()
      setShowDetailsModal(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save details')
    } finally {
      setSavingDetails(false)
    }
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

  const currentStageIndex = getStageIndex(CANDIDATE_STAGES, passData.current_stage)
  const primaryAction = passData.next_actions.length > 0 ? passData.next_actions[0] : null

  const handlePrimaryAction = () => {
    if (!primaryAction) return
    switch (primaryAction.action_id) {
      case 'complete_profile':
        openDetailsModal()
        break
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

  const entityColor = getEntityColor()

  const renderHeader = () => (
    <div className="px-4 pt-4 pb-3 flex-shrink-0">
      <p className="text-xs font-semibold text-slate-500 mb-3">Candidate Pass</p>
      
      {/* Premium Info Card */}
      <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl border border-slate-100 shadow-lg p-4 relative overflow-hidden">
        {/* Subtle corner accent */}
        <div 
          className="absolute top-0 right-0 w-20 h-20 opacity-5 rounded-bl-full"
          style={{ backgroundColor: entityColor }}
        />
        
        <div className="flex items-start gap-3 relative z-10">
          {/* Left: Info */}
          <div className="flex-1 min-w-0">
            <p 
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: entityColor }}
            >
              CANDIDATE
            </p>
            <p className="text-sm font-medium text-slate-700 mb-0.5">{passData.full_name}</p>
            <h2 className="text-lg font-black text-slate-900 leading-tight mb-2">{passData.position_title}</h2>
            
            {/* Premium Pass Number Badge */}
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-2"
              style={{ 
                background: `linear-gradient(135deg, ${entityColor}12 0%, ${entityColor}08 100%)`,
                border: `1px solid ${entityColor}20`
              }}
            >
              <div 
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: entityColor }}
              />
              <span className="text-[10px] font-mono font-bold tracking-wide" style={{ color: entityColor }}>
                {passData.candidate_number}
              </span>
            </div>
            
            <div className="space-y-0.5 text-[11px] text-slate-500">
              <p>Dept: <span className="font-medium text-slate-700">{passData.department || 'General'}</span></p>
              <p>Rec: <span className="font-medium text-slate-700">{passData.recruitment_request_number || 'REC-2026-00001'}</span></p>
            </div>
          </div>
          
          {/* Premium QR Code with Corner Accents */}
          <div 
            onClick={() => setShowQrModal(true)}
            className="flex-shrink-0 relative p-3 bg-gradient-to-br from-white to-slate-50 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            style={{ 
              boxShadow: `inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px ${entityColor}10`
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: entityColor }} />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: entityColor }} />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: entityColor }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: entityColor }} />
            
            <QRCodeSVG 
              value={getProfileUrl()} 
              size={68}
              level="H"
              fgColor={entityColor}
            />
            
            {/* Scan indicator */}
            <div 
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
              style={{ 
                backgroundColor: entityColor,
                boxShadow: `0 4px 12px ${entityColor}40`
              }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Stage/Status Row - Enhanced */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100/80">
          <div className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: entityColor }}
            />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Stage</p>
              <p className="text-xs font-bold text-slate-800">
                {getStageLabel(passData.current_stage, 'candidate')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Status</p>
              <p className="text-xs font-bold text-slate-800">
                {getStatusLabel(passData.current_stage, passData.status, 'candidate')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderJourney = () => (
    <JourneyTimeline 
      stages={CANDIDATE_STAGES}
      currentStageIndex={currentStageIndex}
      entityColor={entityColor}
      viewType="candidate"
    />
  )

  const renderActionRequired = () => (
    activeTab === 'home' ? (
      <ActionRequired action={actionRequiredConfig} entityColor={entityColor} />
    ) : null
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-3">
            {activityItems.length > 0 && (
              <ActivityHistory activities={activityItems} />
            )}
          </div>
        )

      case 'documents':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Documents</h3>
                <p className="text-[10px] text-slate-400">Upload and view documents</p>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-slate-200 p-5 text-center bg-slate-50/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm border border-slate-100">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-600 mb-0.5">Upload Documents</p>
              <p className="text-[10px] text-slate-400 mb-2">Drag & drop or click to browse</p>
              <button 
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors"
                style={{ backgroundColor: entityColor }}
              >
                Choose File
              </button>
            </div>

            <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700">Welcome Message</span>
                <span className="text-[9px] text-slate-400">Today</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Thank you for your application. We're excited to review your profile!
              </p>
            </div>
          </div>
        )

      case 'calendar':
        return (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-800">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-[10px] text-slate-400 font-semibold py-1">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 1
                  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
                  const isToday = day === new Date().getDate()
                  const hasSlot = passData.interview_slots.some(s => new Date(s.slot_date).getDate() === day)
                  const isBooked = passData.booked_slot && new Date(passData.booked_slot.slot_date).getDate() === day
                  return (
                    <div 
                      key={i} 
                      className={`text-xs py-2 rounded-lg cursor-pointer transition-colors ${
                        isBooked ? 'text-white font-bold' :
                        hasSlot ? 'font-medium' :
                        isToday ? 'bg-slate-100 font-semibold text-slate-800' :
                        day > 0 && day <= daysInMonth ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-200'
                      }`}
                      style={
                        isBooked ? { backgroundColor: entityColor } :
                        hasSlot ? { backgroundColor: `${entityColor}20`, color: entityColor } :
                        {}
                      }
                    >
                      {day > 0 && day <= daysInMonth ? day : ''}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `${entityColor}40` }}></div>
                  <span className="text-[10px] text-slate-500">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entityColor }}></div>
                  <span className="text-[10px] text-slate-500">Booked</span>
                </div>
              </div>
            </div>

            {passData.booked_slot ? (
              <div className="rounded-xl p-4 border" style={{ backgroundColor: `${entityColor}10`, borderColor: `${entityColor}30` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: entityColor }}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold" style={{ color: entityColor }}>
                    {passData.booked_slot.candidate_confirmed ? 'Interview Confirmed' : 'Interview Booked'}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {new Date(passData.booked_slot.slot_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs text-slate-500">
                  {passData.booked_slot.start_time.substring(0, 5)} - {passData.booked_slot.end_time.substring(0, 5)}
                </p>
                {!passData.booked_slot.candidate_confirmed && (
                  <button
                    onClick={confirmSlot}
                    disabled={bookingLoading}
                    className="mt-3 w-full py-2.5 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: entityColor }}
                  >
                    {bookingLoading ? 'Confirming...' : 'Confirm Attendance'}
                  </button>
                )}
              </div>
            ) : passData.interview_slots.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Available Slots</p>
                {passData.interview_slots.slice(0, 4).map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all border ${
                      selectedSlot === slot.id 
                        ? 'border-2 shadow-sm' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                    style={selectedSlot === slot.id ? { borderColor: entityColor, backgroundColor: `${entityColor}08` } : {}}
                  >
                    <p className="text-xs font-medium text-slate-800">
                      {new Date(slot.slot_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                    </p>
                  </button>
                ))}
                <button
                  onClick={bookSlot}
                  disabled={!selectedSlot || bookingLoading}
                  className="w-full py-2.5 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: selectedSlot ? entityColor : '#94a3b8' }}
                >
                  {bookingLoading ? 'Booking...' : 'Book Selected Slot'}
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-500">No interview slots available yet</p>
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
                <p className="text-[10px] text-slate-400">Get in touch with us</p>
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
        passType="candidate"
        header={renderHeader()}
        journey={renderJourney()}
        actionRequired={renderActionRequired()}
        tabs={CANDIDATE_TABS}
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
            <h3 className="text-lg font-bold text-slate-800 mb-4">Scan QR Code</h3>
            <div className="inline-block p-4 bg-white rounded-xl border-2 mb-4" style={{ borderColor: entityColor }}>
              <QRCodeSVG 
                value={getProfileUrl()} 
                size={200}
                level="H"
                fgColor={entityColor}
              />
            </div>
            <p className="text-sm text-slate-500 mb-4">Scan to view candidate profile</p>
            <button
              onClick={() => setShowQrModal(false)}
              className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Candidate Details Modal - Baynunah Theme */}
      {showDetailsModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2EB67D15' }}>
                    <svg className="w-4 h-4" style={{ color: '#2EB67D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Your Details</h3>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-500 ml-10">Please verify your information below</p>
            </div>

            {/* Form */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Phone</label>
                <input
                  type="tel"
                  value={detailsForm.phone}
                  onChange={(e) => setDetailsForm({ ...detailsForm, phone: e.target.value })}
                  placeholder="+971 50 000 0000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all"
                  style={{ '--tw-ring-color': '#2EB67D40' } as React.CSSProperties}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={detailsForm.email}
                  onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all"
                  style={{ '--tw-ring-color': '#2EB67D40' } as React.CSSProperties}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Location</label>
                <div className="relative">
                  <select
                    value={detailsForm.location}
                    onChange={(e) => setDetailsForm({ ...detailsForm, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer"
                    style={{ '--tw-ring-color': '#2EB67D40' } as React.CSSProperties}
                  >
                    <option value="">Select location</option>
                    {UAE_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Visa Status & Notice Period Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Visa Status</label>
                  <select
                    value={detailsForm.visa_status}
                    onChange={(e) => setDetailsForm({ ...detailsForm, visa_status: e.target.value })}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer"
                    style={{ '--tw-ring-color': '#2EB67D40' } as React.CSSProperties}
                  >
                    <option value="">Select</option>
                    {VISA_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Notice Period</label>
                  <select
                    value={detailsForm.notice_period}
                    onChange={(e) => setDetailsForm({ ...detailsForm, notice_period: e.target.value })}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer"
                    style={{ '--tw-ring-color': '#2EB67D40' } as React.CSSProperties}
                  >
                    <option value="">Select</option>
                    {NOTICE_PERIODS.map(period => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expected Salary */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Expected Salary</label>
                <div className="relative">
                  <input
                    type="text"
                    value={detailsForm.expected_salary}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setDetailsForm({ ...detailsForm, expected_salary: value })
                    }}
                    placeholder="15,000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all"
                    style={{ '--tw-ring-color': '#2EB67D40' } as React.CSSProperties}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">AED</span>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="pt-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={detailsForm.confirmed}
                      onChange={(e) => setDetailsForm({ ...detailsForm, confirmed: e.target.checked })}
                      className="sr-only"
                    />
                    <div 
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        detailsForm.confirmed 
                          ? '' 
                          : 'border-slate-300 group-hover:border-slate-400'
                      }`}
                      style={detailsForm.confirmed ? { backgroundColor: '#2EB67D', borderColor: '#2EB67D' } : {}}
                    >
                      {detailsForm.confirmed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 leading-tight">
                    I confirm that the details provided are correct
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDetails}
                disabled={!detailsForm.confirmed || savingDetails}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  detailsForm.confirmed && !savingDetails
                    ? 'text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                style={detailsForm.confirmed && !savingDetails ? { 
                  backgroundColor: '#2EB67D',
                  boxShadow: '0 4px 14px rgba(46, 182, 125, 0.3)'
                } : {}}
              >
                {savingDetails ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirm & Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
