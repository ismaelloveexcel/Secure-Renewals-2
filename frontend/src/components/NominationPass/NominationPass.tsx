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
const GREEN_THEME = '#22c55e'

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
      
      // Check if manager has already submitted their one nomination
      const status = await checkNominationStatus(selectedManager.id)
      if (status && status.has_nominated && status.nomination) {
        setExistingNomination(status.nomination)
        setStep('already-nominated')
        return
      }
      
      await fetchEligibleEmployees()
    } catch (err: any) {
      setError(err.message || 'Email or Employee ID does not match. Please try again.')
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
  }

  const neumorphicCard = "bg-slate-100 rounded-2xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff]"
  const neumorphicInset = "bg-slate-100 rounded-xl shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff]"
  const neumorphicButton = "bg-slate-100 rounded-xl shadow-[4px_4px_8px_#d1d5db,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#d1d5db,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] transition-all duration-200"

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className={`${neumorphicCard} p-6 mb-6 text-center`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${GREEN_THEME}20` }}
            >
              <svg className="w-6 h-6" style={{ color: GREEN_THEME }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Employee of the Year</h1>
              <p className="text-sm text-slate-500">{CURRENT_YEAR} Nomination Portal</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {step === 'already-nominated' ? (
            // Show amber indicator for already nominated state
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full scale-125" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-xs text-slate-500">Already Submitted</span>
            </div>
          ) : (
            ['select-manager', 'verify', 'select-nominee', 'form', 'success'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    step === s ? 'scale-125' : ''
                  }`}
                  style={{ 
                    backgroundColor: ['select-manager', 'verify', 'select-nominee', 'form', 'success'].indexOf(step) >= i 
                      ? GREEN_THEME 
                      : '#e2e8f0'
                  }}
                />
                {i < 4 && <div className="w-8 h-0.5 bg-slate-300" />}
              </div>
            ))
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* Step: Select Manager */}
        {step === 'select-manager' && (
          <div className={`${neumorphicCard} p-6`}>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Select Your Name</h2>
            <p className="text-sm text-slate-500 mb-4">Choose your name from the list below</p>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN_THEME, borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {managers.map(manager => (
                  <button
                    key={manager.id}
                    onClick={() => handleManagerSelect(manager)}
                    className={`${neumorphicButton} w-full p-4 text-left flex items-center justify-between`}
                  >
                    <div>
                      <p className="font-medium text-slate-800">{manager.name}</p>
                      <p className="text-xs text-slate-500">{manager.job_title} • {manager.department}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${GREEN_THEME}20`, color: GREEN_THEME }}>
                        {manager.eligible_reports_count} eligible
                      </span>
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
                {managers.length === 0 && !loading && (
                  <p className="text-center text-slate-500 py-4">No managers with eligible team members found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step: Verify Identity */}
        {step === 'verify' && selectedManager && (
          <div className={`${neumorphicCard} p-6`}>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Verify Your Identity</h2>
            <p className="text-sm text-slate-500 mb-4">
              Hi <span className="font-medium">{selectedManager.name}</span>, please enter your email or Employee ID to continue.
            </p>
            
            <div className={`${neumorphicInset} p-1 mb-4`}>
              <input
                type="text"
                value={verificationEmail}
                onChange={(e) => setVerificationEmail(e.target.value)}
                placeholder="Email or Employee ID"
                className="w-full px-4 py-3 bg-transparent border-0 focus:outline-none text-slate-800 placeholder-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('select-manager')}
                className={`${neumorphicButton} flex-1 py-3 text-sm font-medium text-slate-600`}
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={!verificationEmail.trim() || loading}
                className="flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: GREEN_THEME }}
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Already Nominated - Manager has already used their one nomination */}
        {step === 'already-nominated' && existingNomination && (
          <div className={`${neumorphicCard} p-6 text-center`}>
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: '#fef3c720' }}
            >
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-2">Nomination Already Submitted</h2>
            <p className="text-sm text-slate-500 mb-4">
              You have already submitted your nomination for {CURRENT_YEAR}. 
              Only <span className="font-semibold text-slate-700">1 nomination per manager</span> is allowed.
            </p>
            
            <div className={`${neumorphicInset} p-4 mb-6 text-left`}>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Your Nomination</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominee:</span>
                  <span className="font-medium text-slate-800">{existingNomination.nominee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Position:</span>
                  <span className="font-medium text-slate-800">{existingNomination.nominee_job_title || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    existingNomination.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    existingNomination.status === 'shortlisted' ? 'bg-blue-100 text-blue-700' :
                    existingNomination.status === 'winner' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {existingNomination.status === 'pending' ? 'Pending Review' : 
                     existingNomination.status.replace('_', ' ').charAt(0).toUpperCase() + existingNomination.status.replace('_', ' ').slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted:</span>
                  <span className="font-medium text-slate-800">{new Date(existingNomination.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={resetForm}
              className={`${neumorphicButton} w-full py-3 text-sm font-medium text-slate-600`}
            >
              ← Back to Start
            </button>
          </div>
        )}

        {/* Step: Select Nominee */}
        {step === 'select-nominee' && (
          <div className={`${neumorphicCard} p-6`}>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Select Employee to Nominate</h2>
            <p className="text-sm text-slate-500 mb-4">Choose a team member for Employee of the Year</p>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN_THEME, borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {eligibleEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => handleNomineeSelect(emp)}
                    disabled={emp.already_nominated}
                    className={`${neumorphicButton} w-full p-4 text-left flex items-center justify-between ${
                      emp.already_nominated ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: GREEN_THEME }}
                      >
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.job_title}</p>
                      </div>
                    </div>
                    {emp.already_nominated ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        Already Nominated
                      </span>
                    ) : (
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
                {eligibleEmployees.length === 0 && !loading && (
                  <p className="text-center text-slate-500 py-4">No eligible team members found.</p>
                )}
              </div>
            )}
            
            <button
              onClick={() => setStep('verify')}
              className={`${neumorphicButton} w-full py-3 mt-4 text-sm font-medium text-slate-600`}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step: Nomination Form */}
        {step === 'form' && selectedNominee && (
          <div className={`${neumorphicCard} p-6`}>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: GREEN_THEME }}
              >
                {selectedNominee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{selectedNominee.name}</p>
                <p className="text-xs text-slate-500">{selectedNominee.job_title}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Why does this employee deserve to be Employee of the Year? *
                </label>
                <div className={`${neumorphicInset} p-1`}>
                  <textarea
                    value={form.justification}
                    onChange={(e) => setForm({ ...form, justification: e.target.value })}
                    rows={4}
                    placeholder="Describe their exceptional contributions, leadership, and impact... (min 50 characters)"
                    className="w-full px-4 py-3 bg-transparent border-0 focus:outline-none text-slate-800 placeholder-slate-400 resize-none"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{form.justification.length}/50 minimum</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Key Achievements (Optional)
                </label>
                <div className={`${neumorphicInset} p-1`}>
                  <textarea
                    value={form.achievements}
                    onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                    rows={3}
                    placeholder="List notable accomplishments..."
                    className="w-full px-4 py-3 bg-transparent border-0 focus:outline-none text-slate-800 placeholder-slate-400 resize-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Impact on Team/Organization (Optional)
                </label>
                <div className={`${neumorphicInset} p-1`}>
                  <textarea
                    value={form.impact_description}
                    onChange={(e) => setForm({ ...form, impact_description: e.target.value })}
                    rows={3}
                    placeholder="Describe their positive influence..."
                    className="w-full px-4 py-3 bg-transparent border-0 focus:outline-none text-slate-800 placeholder-slate-400 resize-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('select-nominee')}
                className={`${neumorphicButton} flex-1 py-3 text-sm font-medium text-slate-600`}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={form.justification.length < 50 || loading}
                className="flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: GREEN_THEME }}
              >
                {loading ? 'Submitting...' : 'Submit Nomination'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && submittedNomination && (
          <div className={`${neumorphicCard} p-6 text-center`}>
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${GREEN_THEME}20` }}
            >
              <svg className="w-8 h-8" style={{ color: GREEN_THEME }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-2">Nomination Submitted!</h2>
            <p className="text-sm text-slate-500 mb-4">
              Thank you for nominating <span className="font-semibold">{submittedNomination.nominee_name}</span> for Employee of the Year {CURRENT_YEAR}.
            </p>
            
            <div className={`${neumorphicInset} p-4 mb-6 text-left`}>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Nomination Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominee:</span>
                  <span className="font-medium text-slate-800">{submittedNomination.nominee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Position:</span>
                  <span className="font-medium text-slate-800">{submittedNomination.nominee_job_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Pending Review
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={resetForm}
              className={`${neumorphicButton} w-full py-3 text-sm font-medium text-slate-600`}
            >
              Submit Another Nomination
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Need help? Contact HR at <a href="mailto:hr@baynunah.ae" className="underline">hr@baynunah.ae</a>
        </p>
      </div>
    </div>
  )
}
