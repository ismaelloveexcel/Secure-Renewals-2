import { useState, useEffect } from 'react'

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

  const stepIndex = ['select-manager', 'verify', 'select-nominee', 'form', 'success'].indexOf(step)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div 
        className="px-4 py-5 text-white"
        style={{ backgroundColor: THEME_COLOR }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-sm font-semibold uppercase tracking-wide">NOMINATION PASS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-90">baynunah</span>
            <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Pass Card */}
        <div className="bg-white rounded-xl p-4 text-gray-800 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 mb-1">Manager</p>
              <p className="text-[10px] text-gray-400 mb-2">EOY-{CURRENT_YEAR}</p>
              <h2 className="text-lg font-bold text-gray-900">Employee of the Year</h2>
              <p className="text-sm text-gray-600">{CURRENT_YEAR} Nomination</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span 
                className="px-2 py-1 text-xs font-semibold rounded text-white"
                style={{ backgroundColor: step === 'success' ? '#22c55e' : THEME_COLOR }}
              >
                {step === 'success' ? 'SUBMITTED' : 'ACTIVE'}
              </span>
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${THEME_COLOR}10` }}
              >
                <svg className="w-8 h-8" style={{ color: THEME_COLOR }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            {['MANAGER', 'VERIFY', 'NOMINEE', 'FORM', 'DONE'].map((label, i) => (
              <div key={label} className="flex flex-col items-center">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${
                    stepIndex >= i ? 'text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                  style={stepIndex >= i ? { backgroundColor: THEME_COLOR } : {}}
                >
                  {stepIndex > i ? '✓' : i + 1}
                </div>
                <span className="text-[9px] text-gray-500 uppercase">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto pb-24">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">×</button>
          </div>
        )}

        {/* Step: Select Manager */}
        {step === 'select-manager' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Select Your Name</h2>
              <p className="text-sm text-gray-500">Choose your name from the list below</p>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: THEME_COLOR, borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {managers.map(manager => (
                  <button
                    key={manager.id}
                    onClick={() => handleManagerSelect(manager)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: THEME_COLOR }}
                      >
                        {manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{manager.name}</p>
                        <p className="text-xs text-gray-500">{manager.job_title} • {manager.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: `${THEME_COLOR}15`, color: THEME_COLOR }}
                      >
                        {manager.eligible_reports_count} eligible
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
                {managers.length === 0 && !loading && (
                  <p className="text-center text-gray-500 py-8">No managers with eligible team members found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step: Verify Identity */}
        {step === 'verify' && selectedManager && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-1">Verify Your Identity</h2>
            <p className="text-sm text-gray-500 mb-4">
              Hi <span className="font-medium text-gray-700">{selectedManager.name}</span>, please enter your email address.
            </p>
            
            <input
              type="email"
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 mb-3"
              style={{ '--tw-ring-color': THEME_COLOR } as any}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
            
            <p className="text-xs text-gray-400 mb-4">
              After verification, you'll have 30 minutes to complete your nomination.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('select-manager')}
                className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={!verificationEmail.trim() || loading}
                className="flex-1 py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: THEME_COLOR }}
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Already Nominated */}
        {step === 'already-nominated' && existingNomination && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-amber-100">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-lg font-bold text-gray-900 mb-2">Already Submitted</h2>
            <p className="text-sm text-gray-500 mb-4">
              You have already submitted your nomination for {CURRENT_YEAR}. Only 1 nomination per manager is allowed.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Your Nomination</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nominee:</span>
                  <span className="font-medium text-gray-900">{existingNomination.nominee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Position:</span>
                  <span className="font-medium text-gray-900">{existingNomination.nominee_job_title || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    existingNomination.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    existingNomination.status === 'shortlisted' ? 'bg-blue-100 text-blue-700' :
                    existingNomination.status === 'winner' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {existingNomination.status === 'pending' ? 'Pending Review' : 
                     existingNomination.status.replace('_', ' ').charAt(0).toUpperCase() + existingNomination.status.replace('_', ' ').slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted:</span>
                  <span className="font-medium text-gray-900">{new Date(existingNomination.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={resetForm}
              className="w-full py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Start
            </button>
          </div>
        )}

        {/* Step: Select Nominee */}
        {step === 'select-nominee' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Select Employee to Nominate</h2>
              <p className="text-sm text-gray-500">Choose a team member for Employee of the Year</p>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: THEME_COLOR, borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {eligibleEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => handleNomineeSelect(emp)}
                    disabled={emp.already_nominated}
                    className={`w-full p-4 text-left flex items-center justify-between transition-colors ${
                      emp.already_nominated ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: THEME_COLOR }}
                      >
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.job_title}</p>
                      </div>
                    </div>
                    {emp.already_nominated ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                        Already Nominated
                      </span>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
                {eligibleEmployees.length === 0 && !loading && (
                  <p className="text-center text-gray-500 py-8">No eligible team members found.</p>
                )}
              </div>
            )}
            
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setStep('verify')}
                className="w-full py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Step: Nomination Form */}
        {step === 'form' && selectedNominee && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: THEME_COLOR }}
              >
                {selectedNominee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedNominee.name}</p>
                <p className="text-xs text-gray-500">{selectedNominee.job_title}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why does this employee deserve to be Employee of the Year? *
                </label>
                <textarea
                  value={form.justification}
                  onChange={(e) => setForm({ ...form, justification: e.target.value })}
                  rows={4}
                  placeholder="Describe their exceptional contributions, leadership, and impact... (min 50 characters)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                  style={{ '--tw-ring-color': THEME_COLOR } as any}
                />
                <p className="text-xs text-gray-400 mt-1">{form.justification.length}/50 minimum</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Achievements (Optional)
                </label>
                <textarea
                  value={form.achievements}
                  onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                  rows={3}
                  placeholder="List notable accomplishments..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                  style={{ '--tw-ring-color': THEME_COLOR } as any}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impact on Team/Organization (Optional)
                </label>
                <textarea
                  value={form.impact_description}
                  onChange={(e) => setForm({ ...form, impact_description: e.target.value })}
                  rows={3}
                  placeholder="Describe their positive influence..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                  style={{ '--tw-ring-color': THEME_COLOR } as any}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('select-nominee')}
                className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={form.justification.length < 50 || loading}
                className="flex-1 py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: THEME_COLOR }}
              >
                {loading ? 'Submitting...' : 'Submit Nomination'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && submittedNomination && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div 
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: '#dcfce7' }}
            >
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-lg font-bold text-gray-900 mb-2">Nomination Submitted!</h2>
            <p className="text-sm text-gray-500 mb-4">
              Thank you for nominating <span className="font-semibold text-gray-700">{submittedNomination.nominee_name}</span> for Employee of the Year {CURRENT_YEAR}.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Nomination Summary</p>
              <div className="space-y-2 text-sm">
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
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Pending Review
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={resetForm}
              className="w-full py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Start
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? '' : 'opacity-50'}`}
          style={activeTab === 'home' ? { color: THEME_COLOR } : { color: '#6b7280' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('status')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'status' ? '' : 'opacity-50'}`}
          style={activeTab === 'status' ? { color: THEME_COLOR } : { color: '#6b7280' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-xs font-medium">Status</span>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center pb-20 pt-2">
        <p className="text-xs text-gray-400">
          Nomination: <span style={{ color: THEME_COLOR }} className="font-medium">Baynunah Group</span>
        </p>
      </div>
    </div>
  )
}
