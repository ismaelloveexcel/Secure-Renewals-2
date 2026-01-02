import { useState, useEffect } from 'react'

type Section = 'home' | 'employees' | 'onboarding' | 'external' | 'admin' | 'secret-chamber' | 'passes'

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

  const isAdminLogin = pendingSection === 'admin' || pendingSection === 'secret-chamber'

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

  useEffect(() => {
    if (activeSection === 'employees' && user) {
      fetchEmployees()
    } else if (activeSection === 'admin' && user?.role === 'admin') {
      fetchAdminData()
    } else if (activeSection === 'secret-chamber' && user?.role === 'admin') {
      fetchSecretChamberData()
    } else if (activeSection === 'passes' && user) {
      fetchPasses()
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
                placeholder="e.g., EMP001"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.employee_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{emp.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{emp.email || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{emp.department || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          emp.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          emp.role === 'hr' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          emp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
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
              <h1 className="text-2xl font-semibold text-gray-800">Admin Panel</h1>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
              <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                <svg className="w-8 h-8 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="font-medium text-gray-800">Manage Employees</p>
                <p className="text-sm text-gray-500">Add, edit, or remove employees</p>
              </button>
              <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium text-gray-800">View Reports</p>
                <p className="text-sm text-gray-500">Generate HR reports</p>
              </button>
              <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                <svg className="w-8 h-8 text-amber-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="font-medium text-gray-800">Contract Renewals</p>
                <p className="text-sm text-gray-500">Review pending renewals</p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={passFormData.email}
                        onChange={e => setPassFormData({...passFormData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={passFormData.phone}
                        onChange={e => setPassFormData({...passFormData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={passFormData.department}
                        onChange={e => setPassFormData({...passFormData, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input
                        type="text"
                        value={passFormData.position}
                        onChange={e => setPassFormData({...passFormData, position: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Areas</label>
                    <input
                      type="text"
                      value={passFormData.access_areas}
                      onChange={e => setPassFormData({...passFormData, access_areas: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., Lobby, Meeting Rooms, Cafeteria"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <input
                      type="text"
                      value={passFormData.purpose}
                      onChange={e => setPassFormData({...passFormData, purpose: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., Interview, Training, Site Visit"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Name</label>
                    <input
                      type="text"
                      value={passFormData.sponsor_name}
                      onChange={e => setPassFormData({...passFormData, sponsor_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Name of employee sponsor"
                    />
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
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <p className="text-gray-500 mb-2">No passes generated yet</p>
                <p className="text-sm text-gray-400">Click "Generate New Pass" to create your first pass</p>
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
                          pass.pass_type === 'visitor' ? 'bg-purple-100 text-purple-700' :
                          pass.pass_type === 'contractor' ? 'bg-orange-100 text-orange-700' :
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
                          pass.status === 'expired' ? 'bg-gray-100 text-gray-700' :
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

  if (activeSection === 'onboarding') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
        {loginModal}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Onboarding</h2>
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
