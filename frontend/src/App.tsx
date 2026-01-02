import { useState, useEffect } from 'react'

type Section = 'home' | 'employees' | 'onboarding' | 'external' | 'admin' | 'secret-chamber' | 'passes' | 'public-onboarding'

interface Employee {
  id: number
  employee_id: string
  name: string
  email: string | null
  department: string | null
  date_of_birth: string
  role: string
  is_active: boolean
  password_changed: boolean
  created_at: string
  job_title?: string
  location?: string
  probation_status?: string
  employment_status?: string
  profile_status?: string
}

interface FeatureToggle {
  key: string
  description: string
  is_enabled: boolean
  category: string
}

interface AdminDashboard {
  total_employees: number
  active_employees: number
  pending_renewals: number
  features_enabled: number
  features_total: number
  system_status: string
}

interface User {
  employee_id: string
  name: string
  role: string
  token: string
}

interface Pass {
  id: number
  pass_number: string
  pass_type: string
  full_name: string
  email: string | null
  phone: string | null
  department: string | null
  position: string | null
  valid_from: string
  valid_until: string
  access_areas: string | null
  purpose: string | null
  sponsor_name: string | null
  employee_id: string | null
  status: string
  is_printed: boolean
  created_by: string
  created_at: string
}

interface PassFormData {
  pass_type: string
  full_name: string
  email: string
  phone: string
  department: string
  position: string
  valid_from: string
  valid_until: string
  access_areas: string
  purpose: string
  sponsor_name: string
  employee_id: string
}

interface OnboardingToken {
  token: string
  employee_id: string
  employee_name: string
  created_at: string
  expires_at: string
  is_used: boolean
  is_expired: boolean
  access_count: number
}

interface OnboardingWelcome {
  employee_id: string
  name: string
  email: string | null
  department: string | null
  job_title: string | null
  joining_date: string | null
  line_manager_name: string | null
  location: string | null
}

interface ProfileFormData {
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  personal_phone: string
  personal_email: string
  current_address: string
  city: string
  country: string
  bank_name: string
  bank_account_number: string
  bank_iban: string
  passport_number: string
  passport_expiry: string
  uae_id_number: string
  uae_id_expiry: string
  highest_education: string
  shirt_size: string
  pants_size: string
  shoe_size: string
}

interface PendingProfile {
  employee_id: string
  name: string
  department: string | null
  job_title: string | null
  submitted_at: string | null
}

const API_BASE = '/api'

function App() {
  const [activeSection, setActiveSection] = useState<Section>('home')
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [features, setFeatures] = useState<FeatureToggle[]>([])
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [chamberLoading, setChamberLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingSection, setPendingSection] = useState<Section | null>(null)
  const [passes, setPasses] = useState<Pass[]>([])
  const [showPassForm, setShowPassForm] = useState(false)
  const [passFormData, setPassFormData] = useState<PassFormData>({
    pass_type: 'recruitment',
    full_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    access_areas: '',
    purpose: '',
    sponsor_name: '',
    employee_id: '',
  })
  const [passesLoading, setPassesLoading] = useState(false)
  
  // Onboarding state
  const [onboardingTokens, setOnboardingTokens] = useState<OnboardingToken[]>([])
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmployeeId, setInviteEmployeeId] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  
  // Public onboarding state
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null)
  const [onboardingWelcome, setOnboardingWelcome] = useState<OnboardingWelcome | null>(null)
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    personal_phone: '',
    personal_email: '',
    current_address: '',
    city: '',
    country: '',
    bank_name: '',
    bank_account_number: '',
    bank_iban: '',
    passport_number: '',
    passport_expiry: '',
    uae_id_number: '',
    uae_id_expiry: '',
    highest_education: '',
    shirt_size: '',
    pants_size: '',
    shoe_size: '',
  })
  const [profileSubmitted, setProfileSubmitted] = useState(false)

  const isAdminLogin = pendingSection === 'admin' || pendingSection === 'secret-chamber'

  // Check for onboarding token in URL on mount
  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/onboarding/')) {
      const token = path.replace('/onboarding/', '')
      if (token) {
        setOnboardingToken(token)
        setActiveSection('public-onboarding')
        validateAndLoadOnboarding(token)
      }
    }
  }, [])

  const validateAndLoadOnboarding = async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/onboarding/welcome/${token}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Invalid or expired link')
      }
      const data = await res.json()
      setOnboardingWelcome(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate onboarding link')
    } finally {
      setLoading(false)
    }
  }

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    if (user?.token) {
      headers['Authorization'] = `Bearer ${user.token}`
    }
    if (user?.role) {
      headers['X-Role'] = user.role
    }
    return fetch(url, { ...options, headers })
  }

  const handleNavigate = (section: Section) => {
    if (section === 'home') {
      setActiveSection('home')
      return
    }
    if (!user) {
      setPendingSection(section)
      setShowLoginModal(true)
      return
    }
    setActiveSection(section)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const loginEmployeeId = isAdminLogin ? 'ADMIN001' : employeeId
    
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: loginEmployeeId, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Login failed')
      }
      const data = await res.json()
      const loggedInUser = {
        employee_id: data.employee_id,
        name: data.name,
        role: data.role,
        token: data.access_token,
      }
      setUser(loggedInUser)
      setShowLoginModal(false)
      setEmployeeId('')
      setPassword('')
      if (pendingSection) {
        setActiveSection(pendingSection)
        setPendingSection(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setActiveSection('home')
    setEmployees([])
    setFeatures([])
    setDashboard(null)
  }

  const closeLoginModal = () => {
    setShowLoginModal(false)
    setPendingSection(null)
    setError(null)
    setEmployeeId('')
    setPassword('')
  }

  const fetchEmployees = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE}/employees?active_only=false`)
      if (res.ok) {
        const data = await res.json()
        setEmployees(data)
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminData = async () => {
    if (!user || user.role !== 'admin') return
    setLoading(true)
    try {
      const [dashRes, featuresRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/admin/dashboard`),
        fetchWithAuth(`${API_BASE}/admin/features`),
      ])
      if (dashRes.ok) {
        setDashboard(await dashRes.json())
      }
      if (featuresRes.ok) {
        setFeatures(await featuresRes.json())
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSecretChamberData = async () => {
    if (!user || user.role !== 'admin') return
    setChamberLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/features`)
      if (res.ok) {
        setFeatures(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch features:', err)
    } finally {
      setChamberLoading(false)
    }
  }

  const toggleFeature = async (key: string, enabled: boolean) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/features/${key}?is_enabled=${enabled}`, {
        method: 'PUT',
      })
      if (res.ok) {
        setFeatures(features.map(f => f.key === key ? { ...f, is_enabled: enabled } : f))
      }
    } catch (err) {
      console.error('Failed to toggle feature:', err)
    }
  }

  const fetchPasses = async () => {
    if (!user) return
    setPassesLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE}/passes`)
      if (res.ok) {
        const data = await res.json()
        setPasses(data)
      }
    } catch (err) {
      console.error('Failed to fetch passes:', err)
    } finally {
      setPassesLoading(false)
    }
  }

  const createPass = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassesLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuth(`${API_BASE}/passes`, {
        method: 'POST',
        body: JSON.stringify(passFormData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to create pass')
      }
      setShowPassForm(false)
      setPassFormData({
        pass_type: 'recruitment',
        full_name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        access_areas: '',
        purpose: '',
        sponsor_name: '',
        employee_id: '',
      })
      await fetchPasses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pass')
    } finally {
      setPassesLoading(false)
    }
  }

  const revokePass = async (passNumber: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/passes/${passNumber}/revoke`, {
        method: 'POST',
      })
      if (res.ok) {
        await fetchPasses()
      }
    } catch (err) {
      console.error('Failed to revoke pass:', err)
    }
  }

  const fetchOnboardingData = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) return
    setOnboardingLoading(true)
    try {
      const [tokensRes, pendingRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/onboarding/tokens`),
        fetchWithAuth(`${API_BASE}/onboarding/pending`),
      ])
      if (tokensRes.ok) {
        setOnboardingTokens(await tokensRes.json())
      }
      if (pendingRes.ok) {
        setPendingProfiles(await pendingRes.json())
      }
    } catch (err) {
      console.error('Failed to fetch onboarding data:', err)
    } finally {
      setOnboardingLoading(false)
    }
  }

  const generateInviteLink = async () => {
    if (!inviteEmployeeId.trim()) return
    setOnboardingLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuth(`${API_BASE}/onboarding/invite`, {
        method: 'POST',
        body: JSON.stringify({ employee_id: inviteEmployeeId, expires_in_days: 7 }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to generate invite')
      }
      const data = await res.json()
      setGeneratedLink(`${window.location.origin}/onboarding/${data.token}`)
      await fetchOnboardingData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite')
    } finally {
      setOnboardingLoading(false)
    }
  }

  const approveProfile = async (empId: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/onboarding/approve/${empId}`, {
        method: 'POST',
      })
      if (res.ok) {
        await fetchOnboardingData()
      }
    } catch (err) {
      console.error('Failed to approve profile:', err)
    }
  }

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onboardingToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/onboarding/submit/${onboardingToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileFormData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to submit profile')
      }
      setProfileSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit profile')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  useEffect(() => {
    if (activeSection === 'employees' && user) {
      fetchEmployees()
    } else if (activeSection === 'admin' && user?.role === 'admin') {
      fetchAdminData()
    } else if (activeSection === 'secret-chamber' && user?.role === 'admin') {
      fetchSecretChamberData()
    } else if (activeSection === 'passes' && user) {
      fetchPasses()
    } else if (activeSection === 'onboarding' && user && (user.role === 'admin' || user.role === 'hr')) {
      fetchOnboardingData()
    }
  }, [activeSection, user])

  const loginModal = showLoginModal ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button
          onClick={closeLoginModal}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-6">
          <img src="/assets/logo.png" alt="Baynunah" className="h-8 mx-auto mb-2" />
          <h2 className="text-xl font-semibold text-gray-800">
            {isAdminLogin ? 'Admin Sign In' : 'Sign In'}
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
          {!isAdminLogin && (
            <div>
              <label htmlFor="employee-id" className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                id="employee-id"
                name="employee_id"
                type="text"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., BAYN00008"
                required
                autoComplete="username"
                data-testid="employee-id-input"
              />
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {isAdminLogin ? 'Admin Password' : 'Password'}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={isAdminLogin ? 'Enter admin password' : 'First login: DOB as DDMMYYYY'}
              required
              autoComplete="current-password"
              data-testid="password-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            data-testid="sign-in-button"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center mt-4">
          {isAdminLogin 
            ? 'Enter the admin password to access the admin panel.'
            : 'First-time login? Use your date of birth (DDMMYYYY) as password.'
          }
        </p>
      </div>
    </div>
  ) : null

  // Public Onboarding Page (for new joiners)
  if (activeSection === 'public-onboarding') {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your onboarding...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Link Invalid or Expired</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">Please contact HR for a new onboarding link.</p>
          </div>
        </div>
      )
    }

    if (profileSubmitted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <svg className="w-16 h-16 text-emerald-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Submitted!</h2>
            <p className="text-gray-600 mb-6">Thank you for completing your profile. HR will review your information shortly.</p>
            <p className="text-sm text-gray-500">You can close this window now.</p>
          </div>
        </div>
      )
    }

    if (onboardingWelcome) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                <img src="/assets/logo.png" alt="Baynunah" className="h-8 mb-4 brightness-0 invert" />
                <h1 className="text-2xl font-semibold mb-1">Welcome, {onboardingWelcome.name}!</h1>
                <p className="text-emerald-100">Please complete your profile information below</p>
              </div>

              {/* Employee Info Card */}
              <div className="p-6 bg-gray-50 border-b">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Employee ID</p>
                    <p className="font-medium">{onboardingWelcome.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Department</p>
                    <p className="font-medium">{onboardingWelcome.department || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Job Title</p>
                    <p className="font-medium">{onboardingWelcome.job_title || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{onboardingWelcome.location || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={submitProfile} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
                )}

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Contact Name *"
                      value={profileFormData.emergency_contact_name}
                      onChange={e => setProfileFormData({...profileFormData, emergency_contact_name: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={profileFormData.emergency_contact_phone}
                      onChange={e => setProfileFormData({...profileFormData, emergency_contact_phone: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <select
                      value={profileFormData.emergency_contact_relationship}
                      onChange={e => setProfileFormData({...profileFormData, emergency_contact_relationship: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">Relationship *</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Personal Contact */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="tel"
                      placeholder="Personal Phone"
                      value={profileFormData.personal_phone}
                      onChange={e => setProfileFormData({...profileFormData, personal_phone: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="email"
                      placeholder="Personal Email"
                      value={profileFormData.personal_email}
                      onChange={e => setProfileFormData({...profileFormData, personal_email: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Current Address
                  </h3>
                  <div className="space-y-4">
                    <textarea
                      placeholder="Street Address"
                      value={profileFormData.current_address}
                      onChange={e => setProfileFormData({...profileFormData, current_address: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        value={profileFormData.city}
                        onChange={e => setProfileFormData({...profileFormData, city: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={profileFormData.country}
                        onChange={e => setProfileFormData({...profileFormData, country: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Bank Details (for salary)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={profileFormData.bank_name}
                      onChange={e => setProfileFormData({...profileFormData, bank_name: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={profileFormData.bank_account_number}
                      onChange={e => setProfileFormData({...profileFormData, bank_account_number: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="IBAN"
                      value={profileFormData.bank_iban}
                      onChange={e => setProfileFormData({...profileFormData, bank_iban: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* ID Documents */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    ID Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Passport Number"
                      value={profileFormData.passport_number}
                      onChange={e => setProfileFormData({...profileFormData, passport_number: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Passport Expiry (DD/MM/YYYY)"
                      value={profileFormData.passport_expiry}
                      onChange={e => setProfileFormData({...profileFormData, passport_expiry: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="UAE ID Number"
                      value={profileFormData.uae_id_number}
                      onChange={e => setProfileFormData({...profileFormData, uae_id_number: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="UAE ID Expiry (DD/MM/YYYY)"
                      value={profileFormData.uae_id_expiry}
                      onChange={e => setProfileFormData({...profileFormData, uae_id_expiry: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Other Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Highest Education"
                      value={profileFormData.highest_education}
                      onChange={e => setProfileFormData({...profileFormData, highest_education: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Shirt Size"
                      value={profileFormData.shirt_size}
                      onChange={e => setProfileFormData({...profileFormData, shirt_size: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Pants Size"
                      value={profileFormData.pants_size}
                      onChange={e => setProfileFormData({...profileFormData, pants_size: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Shoe Size"
                      value={profileFormData.shoe_size}
                      onChange={e => setProfileFormData({...profileFormData, shoe_size: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Submitting...' : 'Submit Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  if (activeSection === 'employees') {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        {loginModal}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <img src="/assets/logo.png" alt="Baynunah" className="h-6 mb-1" />
              <h1 className="text-2xl font-semibold text-gray-800">Employees</h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-600">
                  {user.name} ({user.role})
                </span>
              )}
              <button
                onClick={() => handleNavigate('home')}
                className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No employees found</p>
                <p className="text-sm text-gray-400">Add employees via CSV import or the admin panel</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.employee_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{emp.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{emp.job_title || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{emp.department || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          emp.employment_status === 'Active' ? 'bg-green-100 text-green-700' :
                          emp.employment_status === 'Terminated' ? 'bg-red-100 text-red-700' :
                          emp.employment_status === 'Resigned' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {emp.employment_status || (emp.is_active ? 'Active' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          emp.profile_status === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                          emp.profile_status === 'pending_review' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {emp.profile_status === 'complete' ? 'Complete' :
                           emp.profile_status === 'pending_review' ? 'Pending Review' :
                           'Incomplete'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">Total: {employees.length} employees</p>
        </div>
      </div>
    )
  }

  if (activeSection === 'secret-chamber') {
    if (user?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
          {loginModal}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You need admin privileges to access this section.</p>
            <button
              onClick={() => handleNavigate('home')}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
        {loginModal}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-purple-300 text-sm tracking-widest uppercase mb-1">Secret Chamber</p>
              <h1 className="text-2xl font-semibold text-white">System Configuration</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-purple-300">
                {user?.name}
              </span>
              <button
                onClick={() => setActiveSection('admin')}
                className="px-4 py-2 text-purple-300 hover:text-white hover:bg-purple-800/50 rounded-lg transition-colors"
              >
                ← Back to Admin
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Feature Toggles
            </h2>
            {chamberLoading ? (
              <div className="text-center text-purple-300 py-8">Loading...</div>
            ) : features.length === 0 ? (
              <div className="text-center text-purple-300 py-8">No features configured</div>
            ) : (
              <div className="space-y-3">
                {features.map(feature => (
                  <div key={feature.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                    <div>
                      <p className="font-medium text-white">{feature.key}</p>
                      <p className="text-sm text-purple-300">{feature.description}</p>
                      <span className="text-xs text-purple-400">{feature.category}</span>
                    </div>
                    <button
                      onClick={() => toggleFeature(feature.key, !feature.is_enabled)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        feature.is_enabled ? 'bg-purple-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${
                          feature.is_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-purple-400/50 text-xs text-center mt-8">
            This area is restricted to system administrators only.
          </p>
        </div>
      </div>
    )
  }

  if (activeSection === 'admin') {
    if (user?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
          {loginModal}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You need admin privileges to access this section.</p>
            <button
              onClick={() => handleNavigate('home')}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-100 p-8 relative">
        {loginModal}
        
        <button
          onClick={() => setActiveSection('secret-chamber')}
          className="absolute bottom-6 right-6 p-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group"
          style={{ boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)' }}
          title="Secret Chamber"
        >
          <svg 
            className="w-6 h-6 text-purple-300 group-hover:text-purple-500 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
        </button>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <img src="/assets/logo.png" alt="Baynunah" className="h-6 mb-1" />
              <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.name} ({user?.role})
              </span>
              <button
                onClick={() => handleNavigate('home')}
                className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-3xl font-semibold text-gray-800">{dashboard.total_employees}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Active Employees</p>
                <p className="text-3xl font-semibold text-emerald-600">{dashboard.active_employees}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Pending Renewals</p>
                <p className="text-3xl font-semibold text-amber-600">{dashboard.pending_renewals}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-500">Features Enabled</p>
                <p className="text-3xl font-semibold text-blue-600">{dashboard.features_enabled}/{dashboard.features_total}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setActiveSection('employees')}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <svg className="w-8 h-8 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="font-medium text-gray-800">Manage Employees</p>
                <p className="text-sm text-gray-500">View and manage employees</p>
              </button>
              <button 
                onClick={() => setActiveSection('onboarding')}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <p className="font-medium text-gray-800">Onboarding</p>
                <p className="text-sm text-gray-500">Invite new joiners</p>
              </button>
              <button 
                onClick={() => setActiveSection('passes')}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <svg className="w-8 h-8 text-amber-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <p className="font-medium text-gray-800">Pass Generation</p>
                <p className="text-sm text-gray-500">Create visitor passes</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeSection === 'passes') {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        {loginModal}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <img src="/assets/logo.png" alt="Baynunah" className="h-6 mb-1" />
              <h1 className="text-2xl font-semibold text-gray-800">Pass Generation</h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-600">
                  {user.name} ({user.role})
                </span>
              )}
              <button
                onClick={() => handleNavigate('home')}
                className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Passes</p>
                  <p className="text-2xl font-bold text-gray-800">{passes.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-600">{passes.filter(p => p.status === 'active').length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{passes.filter(p => p.status === 'expired').length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Revoked</p>
                  <p className="text-2xl font-bold text-gray-600">{passes.filter(p => p.status === 'revoked').length}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowPassForm(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate New Pass
            </button>
          </div>

          {showPassForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Generate New Pass</h2>
                  <button
                    onClick={() => setShowPassForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
                )}
                
                <form onSubmit={createPass} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type</label>
                      <select
                        value={passFormData.pass_type}
                        onChange={e => setPassFormData({...passFormData, pass_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="recruitment">Recruitment</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="visitor">Visitor</option>
                        <option value="contractor">Contractor</option>
                        <option value="temporary">Temporary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={passFormData.full_name}
                        onChange={e => setPassFormData({...passFormData, full_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
                      <input
                        type="date"
                        value={passFormData.valid_from}
                        onChange={e => setPassFormData({...passFormData, valid_from: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                      <input
                        type="date"
                        value={passFormData.valid_until}
                        onChange={e => setPassFormData({...passFormData, valid_until: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={passesLoading}
                      className="flex-1 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {passesLoading ? 'Creating...' : 'Generate Pass'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassForm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {passesLoading && passes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Loading passes...</div>
            ) : passes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-2">No passes generated yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {passes.map(pass => (
                    <tr key={pass.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{pass.pass_number}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          pass.pass_type === 'recruitment' ? 'bg-blue-100 text-blue-700' :
                          pass.pass_type === 'onboarding' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {pass.pass_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{pass.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {pass.valid_from} to {pass.valid_until}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          pass.status === 'active' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pass.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {pass.status === 'active' && (
                          <button
                            onClick={() => revokePass(pass.pass_number)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Onboarding Management (HR View)
  if (activeSection === 'onboarding') {
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
          {loginModal}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Required</h2>
            <p className="text-gray-600 mb-6">Please sign in with HR or Admin access.</p>
            <button
              onClick={() => handleNavigate('home')}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        {loginModal}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <img src="/assets/logo.png" alt="Baynunah" className="h-6 mb-1" />
              <h1 className="text-2xl font-semibold text-gray-800">Onboarding Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>
              <button
                onClick={() => handleNavigate('home')}
                className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          {/* Invite New Joiner Button */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setShowInviteModal(true)
                setGeneratedLink('')
                setInviteEmployeeId('')
                setError(null)
              }}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite New Joiner
            </button>
          </div>

          {/* Invite Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Generate Onboarding Link</h2>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
                )}

                {!generatedLink ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={inviteEmployeeId}
                        onChange={e => setInviteEmployeeId(e.target.value)}
                        placeholder="e.g., BAYN00010"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      onClick={generateInviteLink}
                      disabled={onboardingLoading || !inviteEmployeeId.trim()}
                      className="w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {onboardingLoading ? 'Generating...' : 'Generate Link'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <p className="text-sm text-emerald-800 mb-2">Share this link with the new joiner:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={generatedLink}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(generatedLink)}
                          className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">This link expires in 7 days.</p>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pending Profiles */}
          {pendingProfiles.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                Pending Profile Reviews ({pendingProfiles.length})
              </h2>
              <div className="space-y-3">
                {pendingProfiles.map(profile => (
                  <div key={profile.employee_id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{profile.name}</p>
                      <p className="text-sm text-gray-500">
                        {profile.employee_id} • {profile.department || 'No department'} • {profile.job_title || 'No title'}
                      </p>
                      {profile.submitted_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted: {new Date(profile.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => approveProfile(profile.employee_id)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onboarding Tokens */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Onboarding Invites</h2>
            </div>
            {onboardingLoading && onboardingTokens.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : onboardingTokens.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No onboarding invites yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Invite New Joiner" to create one</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {onboardingTokens.map(token => (
                    <tr key={token.token} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{token.employee_name}</p>
                        <p className="text-xs text-gray-500">{token.employee_id}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(token.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(token.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          token.is_used ? 'bg-emerald-100 text-emerald-700' :
                          token.is_expired ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {token.is_used ? 'Completed' : token.is_expired ? 'Expired' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{token.access_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (activeSection === 'external') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
        {loginModal}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">External Users</h2>
          <p className="text-gray-600 mb-6">This section is under development.</p>
          <button
            onClick={() => handleNavigate('home')}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8" style={{ transform: 'scale(0.95)', transformOrigin: 'center center' }}>
      {loginModal}
      
      {user && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <img src="/assets/logo.png" alt="Baynunah" className="h-6 mx-auto mb-4" />
        <h1 className="text-4xl font-light tracking-widest text-gray-800">HR PORTAL</h1>
      </div>

      <div className="grid grid-cols-2 gap-3" style={{ width: '420px' }}>
        <button
          onClick={() => handleNavigate('employees')}
          className="bg-gradient-to-br from-white to-gray-50 rounded-tl-full rounded-tr-md rounded-bl-md rounded-br-md p-8 flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-12 h-12 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">Employees</span>
        </button>

        <button
          onClick={() => handleNavigate('onboarding')}
          className="bg-gradient-to-br from-white to-gray-50 rounded-tr-full rounded-tl-md rounded-bl-md rounded-br-md p-8 flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-12 h-12 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">Onboarding</span>
        </button>

        <button
          onClick={() => handleNavigate('external')}
          className="bg-gradient-to-br from-white to-gray-50 rounded-bl-full rounded-tl-md rounded-tr-md rounded-br-md p-8 flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-12 h-12 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span className="text-sm font-medium text-gray-700 uppercase tracking-wide text-center">External<br/>Users</span>
        </button>

        <button
          onClick={() => handleNavigate('admin')}
          className="bg-gradient-to-br from-white to-gray-50 rounded-br-full rounded-tl-md rounded-tr-md rounded-bl-md p-8 flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-12 h-12 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">Admin</span>
        </button>
      </div>

      <p className="text-gray-400 text-xs mt-12">Conceptualised by Baynunah HR|IS</p>
    </div>
  )
}

export default App
