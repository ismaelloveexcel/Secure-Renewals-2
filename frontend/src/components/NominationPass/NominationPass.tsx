import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Manager {
  id: number
  employee_id: string
  name: string
  job_title: string | null
  department: string | null
  email: string | null
  eligible_reports_count: number
}

interface EligibleEmployee {
  id: number
  employee_id: string
  name: string
  job_title: string | null
  department: string | null
  profile_photo_path: string | null
  years_of_service: number | null
  already_nominated: boolean
}

interface NominationForm {
  nominee_id: number | null
  justification: string
  achievements: string
  impact_description: string
}

interface ExistingNomination {
  id: number
  nominee_name: string
  nominee_job_title: string | null
  status: string
  created_at: string
}

interface ManagerNominationStatus {
  has_nominated: boolean
  nomination: ExistingNomination | null
  can_nominate: boolean
}

type Step = 'select-manager' | 'verify' | 'already-nominated' | 'select-nominee' | 'form' | 'success'

const API_BASE = '/api'
const CURRENT_YEAR = new Date().getFullYear()
const THEME_COLOR = '#1800ad'

export function NominationPass() {
  const [step, setStep] = useState<Step>('select-manager')
  const [managers, setManagers] = useState<Manager[]>([])
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [eligibleEmployees, setEligibleEmployees] = useState<EligibleEmployee[]>([])
  const [selectedNominee, setSelectedNominee] = useState<EligibleEmployee | null>(null)
  const [existingNomination, setExistingNomination] = useState<ExistingNomination | null>(null)
  const [form, setForm] = useState<NominationForm>({
    nominee_id: null,
    justification: '',
    achievements: '',
    impact_description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedNomination, setSubmittedNomination] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'home' | 'status'>('home')

  useEffect(() => {
    fetchManagers()
  }, [])

  const fetchManagers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/nominations/pass/managers?year=${CURRENT_YEAR}`)
      if (!res.ok) throw new Error('Failed to load managers')
      const data = await res.json()
      setManagers(data)
    } catch (err) {
      setError('Could not load manager list. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const checkNominationStatus = async (managerId: number): Promise<ManagerNominationStatus | null> => {
    try {
      const res = await fetch(`${API_BASE}/nominations/pass/status/${managerId}?year=${CURRENT_YEAR}`)
      if (!res.ok) return null
      return await res.json()
    } catch (err) {
      return null
    }
  }

  const handleManagerSelect = (manager: Manager) => {
    setSelectedManager(manager)
    setVerificationEmail('')
    setExistingNomination(null)
    setStep('verify')
  }

  const handleVerify = async () => {
    if (!selectedManager) return
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`${API_BASE}/nominations/pass/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: selectedManager.id,
          verification_input: verificationEmail.trim()
        })
      })
      
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Verification failed')
      }
      
      const data = await res.json()
      setVerificationToken(data.token)
      
      const status = await checkNominationStatus(selectedManager.id)
      if (status && status.has_nominated && status.nomination) {
        setExistingNomination(status.nomination)
        setStep('already-nominated')
        return
      }
      
      await fetchEligibleEmployees()
    } catch (err: any) {
      setError(err.message || 'Email address does not match. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchEligibleEmployees = async () => {
    if (!selectedManager) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/nominations/eligible-employees/${selectedManager.id}?year=${CURRENT_YEAR}`)
      if (!res.ok) throw new Error('Failed to load team members')
      const data = await res.json()
      setEligibleEmployees(data)
      setStep('select-nominee')
    } catch (err) {
      setError('Could not load your team. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNomineeSelect = (employee: EligibleEmployee) => {
    if (employee.already_nominated) return
    setSelectedNominee(employee)
    setForm({ ...form, nominee_id: employee.id })
    setStep('form')
  }

  const handleSubmit = async () => {
    if (!selectedManager || !selectedNominee || !verificationToken) return
    if (form.justification.length < 50) {
      setError('Please provide at least 50 characters explaining why this employee deserves the award.')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/nominations/pass/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominee_id: selectedNominee.id,
          justification: form.justification,
          achievements: form.achievements || null,
          impact_description: form.impact_description || null,
          verification_token: verificationToken
        })
      })
      
      if (!res.ok) {
        const errData = await res.json()
        if (res.status === 401) {
          setVerificationToken(null)
          setStep('verify')
          throw new Error('Session expired. Please verify your identity again.')
        }
        throw new Error(errData.detail || 'Failed to submit nomination')
      }
      
      const data = await res.json()
      setSubmittedNomination(data)
      setVerificationToken(null)
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Could not submit nomination. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('select-manager')
    setSelectedManager(null)
    setSelectedNominee(null)
    setVerificationEmail('')
    setVerificationToken(null)
    setEligibleEmployees([])
    setExistingNomination(null)
    setForm({ nominee_id: null, justification: '', achievements: '', impact_description: '' })
    setSubmittedNomination(null)
    setError(null)
    setActiveTab('home')
  }

  const stepLabels = ['Access', 'Selection', 'Verification', 'Nomination', 'Submission']
  const stepDescriptions = [
    'Manager enters the nomination portal',
    'Manager selects their name from the authorized list',
    'Email verification to confirm identity',
    'Manager submits the employee nomination',
    'Confirmation & record locked'
  ]
  const stepMapping: Record<Step, number> = {
    'select-manager': 1,
    'verify': 2,
    'already-nominated': 4,
    'select-nominee': 3,
    'form': 3,
    'success': 4
  }
  const stepIndex = stepMapping[step]

  const getStepLabel = () => {
    switch (step) {
      case 'select-manager': return 'Selection'
      case 'verify': return 'Verification'
      case 'already-nominated': return 'Submission'
      case 'select-nominee': return 'Nomination'
      case 'form': return 'Nomination'
      case 'success': return 'Submission'
      default: return 'Access'
    }
  }

  const getStatusLabel = () => {
    switch (step) {
      case 'success': return 'Completed'
      case 'already-nominated': return 'Completed'
      default: return 'In Progress'
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case 'select-manager': return 'Choose your name from the manager list'
      case 'verify': return 'Enter your email to verify identity'
      case 'already-nominated': return 'You have already nominated for this year'
      case 'select-nominee': return 'Choose a team member to nominate'
      case 'form': return 'Explain why they deserve the award'
      case 'success': return 'Thank you for your nomination'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-lg h-full max-h-[100dvh] sm:max-h-[95dvh] flex flex-col">
        {/* Pass Card Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0">
          {/* Header - Premium Manager Pass Style */}
          <div 
            className="px-5 py-4 sm:px-6 sm:py-5 text-white shrink-0"
            style={{ backgroundColor: THEME_COLOR }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Nomination Pass</p>
              </div>
              <div className="flex items-center">
                <img 
                  src="/assets/baynunah-logo.png" 
                  alt="Baynunah" 
                  className="h-6 sm:h-7 object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
            </div>
          </div>

          {/* Main Card Content */}
          <div className="p-3 sm:p-5 flex-1 overflow-y-auto min-h-0">
            {/* Info Section with QR */}
            <div className="flex justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-100">
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Employee of the Year</h2>
                  <p className="text-xs sm:text-sm text-gray-500">{selectedManager?.department || <span className="font-bold">Year {CURRENT_YEAR}</span>}</p>
                </div>
                
                {/* Stage & Status Row */}
                <div className="flex items-center gap-4 sm:gap-6 mt-2 sm:mt-3">
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Stage</p>
                    <p className="text-[11px] sm:text-xs font-semibold" style={{ color: THEME_COLOR }}>{getStepLabel()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
                    <p className="text-[11px] sm:text-xs font-semibold text-gray-700">{getStatusLabel()}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 sm:gap-1.5 ml-3 sm:ml-4">
                <span 
                  className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded text-white"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  {step === 'success' ? 'SUBMITTED' : 'ACTIVE'}
                </span>
                <div className="bg-white p-1 sm:p-1.5 rounded-lg border border-gray-100 shadow-sm">
                  <QRCodeSVG 
                    value={`https://hr.baynunah.ae/nomination-pass`}
                    size={50}
                    level="M"
                    fgColor={THEME_COLOR}
                    className="w-[45px] h-[45px] sm:w-[55px] sm:h-[55px]"
                  />
                </div>
              </div>
            </div>

            {/* Progress Steps - Grid for Equal Spacing */}
            <div className="grid grid-cols-5 gap-0 mb-3 sm:mb-5">
              {stepLabels.map((label, i) => {
                const isCompleted = stepIndex > i
                const isCurrent = stepIndex === i
                const stepColor = isCompleted ? '#22c55e' : (isCurrent ? THEME_COLOR : undefined)
                const isLast = i === stepLabels.length - 1
                
                return (
                  <div 
                    key={label} 
                    className="flex flex-col items-center relative"
                    title={stepDescriptions[i]}
                  >
                    <div className="flex items-center w-full justify-center">
                      {i > 0 && (
                        <div 
                          className={`h-0.5 flex-1 ${stepIndex > i - 1 ? '' : 'bg-gray-200'}`}
                          style={stepIndex > i - 1 ? { backgroundColor: '#22c55e' } : {}}
                        />
                      )}
                      <div 
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                          stepIndex >= i ? 'text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                        style={stepColor ? { backgroundColor: stepColor } : {}}
                        title={stepDescriptions[i]}
                      >
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-[10px] sm:text-xs">{i + 1}</span>
                        )}
                      </div>
                      {!isLast && (
                        <div 
                          className={`h-0.5 flex-1 ${stepIndex > i ? '' : 'bg-gray-200'}`}
                          style={stepIndex > i ? { backgroundColor: '#22c55e' } : {}}
                        />
                      )}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-gray-500 mt-1.5 sm:mt-2 text-center">{label}</span>
                  </div>
                )
              })}
            </div>

            {/* Next Action Card */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Next Action</p>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div 
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: THEME_COLOR }}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800">{getStepLabel()}</p>
                  <p className="text-[11px] sm:text-xs text-gray-500">{getStepDescription()}</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">×</button>
              </div>
            )}

            {/* Step Content */}
            <div className="min-h-0 flex-1">
              {/* Step: Select Manager */}
              {step === 'select-manager' && (
                <div>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: THEME_COLOR, borderTopColor: 'transparent' }} />
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2 max-h-[40vh] sm:max-h-64 overflow-y-auto">
                      {managers.map(manager => (
                        <button
                          key={manager.id}
                          onClick={() => handleManagerSelect(manager)}
                          className="w-full p-2.5 sm:p-3 text-left flex items-center justify-between bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div 
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shrink-0"
                              style={{ backgroundColor: THEME_COLOR }}
                            >
                              {manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{manager.name}</p>
                              <p className="text-[11px] sm:text-xs text-gray-500 truncate">{manager.job_title}</p>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                      {managers.length === 0 && !loading && (
                        <p className="text-center text-gray-500 py-8 text-sm">No managers with eligible team members found.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Verify Identity */}
              {step === 'verify' && selectedManager && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Hi <span className="font-semibold text-gray-800">{selectedManager.name}</span>, please enter your email address to continue.
                  </p>
                  
                  <input
                    type="email"
                    value={verificationEmail}
                    onChange={(e) => setVerificationEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 mb-3 text-sm"
                    style={{ '--tw-ring-color': THEME_COLOR } as any}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  />
                  
                  <p className="text-xs text-gray-400 mb-4">
                    After verification, you'll have 30 minutes to complete your nomination.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('select-manager')}
                      className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleVerify}
                      disabled={!verificationEmail.trim() || loading}
                      className="flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                      style={{ backgroundColor: THEME_COLOR }}
                    >
                      {loading ? 'Verifying...' : 'Continue'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Already Nominated */}
              {step === 'already-nominated' && existingNomination && (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-amber-100">
                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-base font-bold text-gray-900 mb-2">Already Submitted</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    You have already submitted your nomination for {CURRENT_YEAR}.
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Your Nomination</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nominee:</span>
                        <span className="font-medium text-gray-900">{existingNomination.nominee_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          existingNomination.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          existingNomination.status === 'shortlisted' ? 'bg-purple-100 text-purple-700' :
                          existingNomination.status === 'winner' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {existingNomination.status === 'pending' ? 'Submitted' : 
                           existingNomination.status.replace('_', ' ').charAt(0).toUpperCase() + existingNomination.status.replace('_', ' ').slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={resetForm}
                    className="w-full py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    ← Back to Start
                  </button>
                </div>
              )}

              {/* Step: Select Nominee */}
              {step === 'select-nominee' && selectedManager && (
                <div>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: THEME_COLOR, borderTopColor: 'transparent' }} />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
                        {eligibleEmployees.map((emp) => (
                          <button
                            key={emp.id}
                            onClick={() => handleNomineeSelect(emp)}
                            disabled={emp.already_nominated}
                            className={`w-full p-3 text-left flex items-center justify-between border rounded-xl transition-all ${
                              emp.already_nominated 
                                ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' 
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                style={{ backgroundColor: emp.already_nominated ? '#9ca3af' : THEME_COLOR }}
                              >
                                {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                                <p className="text-xs text-gray-500">{emp.job_title}</p>
                              </div>
                            </div>
                            {emp.already_nominated ? (
                              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                                Nominated
                              </span>
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                        {eligibleEmployees.length === 0 && !loading && (
                          <p className="text-center text-gray-500 py-6 text-sm">No eligible team members found.</p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setStep('verify')}
                        className="w-full py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        ← Back
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Step: Nomination Form */}
              {step === 'form' && selectedNominee && (
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: THEME_COLOR }}
                    >
                      {selectedNominee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{selectedNominee.name}</p>
                      <p className="text-xs text-gray-500">{selectedNominee.job_title}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Why does this employee deserve the award? *
                      </label>
                      <textarea
                        value={form.justification}
                        onChange={(e) => setForm({ ...form, justification: e.target.value })}
                        rows={3}
                        placeholder="Describe their contributions... (min 50 characters)"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none text-sm"
                        style={{ '--tw-ring-color': THEME_COLOR } as any}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">{form.justification.length}/50 minimum</p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Key Achievements (Optional)
                      </label>
                      <textarea
                        value={form.achievements}
                        onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                        rows={2}
                        placeholder="List notable accomplishments..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none text-sm"
                        style={{ '--tw-ring-color': THEME_COLOR } as any}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setStep('select-nominee')}
                      className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={form.justification.length < 50 || loading}
                      className="flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                      style={{ backgroundColor: THEME_COLOR }}
                    >
                      {loading ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Success */}
              {step === 'success' && submittedNomination && (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-green-100">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <h3 className="text-base font-bold text-gray-900 mb-2">Nomination Submitted!</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Thank you for nominating <span className="font-semibold text-gray-700">{submittedNomination.nominee_name}</span>.
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Summary</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nominee:</span>
                        <span className="font-medium text-gray-900">{submittedNomination.nominee_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Position:</span>
                        <span className="font-medium text-gray-900">{submittedNomination.nominee_job_title}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                          Submitted
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={resetForm}
                    className="w-full py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Back to Start
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="border-t border-gray-100 px-4 sm:px-6 py-2 sm:py-3 flex justify-around bg-white shrink-0">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'home' ? '' : 'opacity-50'}`}
              style={activeTab === 'home' ? { color: THEME_COLOR } : { color: '#6b7280' }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[9px] sm:text-[10px] font-medium">Home</span>
            </button>
            <button 
              onClick={() => setActiveTab('status')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'status' ? '' : 'opacity-50'}`}
              style={activeTab === 'status' ? { color: THEME_COLOR } : { color: '#6b7280' }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-[9px] sm:text-[10px] font-medium">Status</span>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center py-2 sm:py-3 bg-gray-50 border-t border-gray-100 shrink-0">
            <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">
              Baynunah Watergeneration Technologies SP LLC
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
