import { useState, useEffect } from 'react'
import type { RenewalRequest, RenewalResponse } from './types/renewal'
import { listRenewals, createRenewal, getHealth, login, changePassword } from './services/api'
import type { LoginResponse } from './services/api'

type Section = 'home' | 'employees' | 'onboarding' | 'external' | 'admin'

// User session type
interface UserSession {
  token: string
  employeeId: string
  name: string
  role: string
  requiresPasswordChange: boolean
}

// Navigation Item component
function NavItem({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

// Sidebar component
function Sidebar({ activeSection, setActiveSection }: { 
  activeSection: Section
  setActiveSection: (section: Section) => void 
}) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <p className="text-gray-500 text-sm tracking-wide">baynunah<span className="text-emerald-500">.</span></p>
        <h1 className="text-xl font-semibold text-gray-800">HR Portal</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <NavItem
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
          label="Home"
          active={activeSection === 'home'}
          onClick={() => setActiveSection('home')}
        />
        <NavItem
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          label="Employees"
          active={activeSection === 'employees'}
          onClick={() => setActiveSection('employees')}
        />
        <NavItem
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          label="Onboarding"
          active={activeSection === 'onboarding'}
          onClick={() => setActiveSection('onboarding')}
        />
        <NavItem
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
          label="External Users"
          active={activeSection === 'external'}
          onClick={() => setActiveSection('external')}
        />
        <NavItem
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
          label="Admin"
          active={activeSection === 'admin'}
          onClick={() => setActiveSection('admin')}
        />
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Secure Renewals v1.0</p>
      </div>
    </aside>
  )
}

// Home section
function HomeSection({ setActiveSection }: { setActiveSection: (section: Section) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-center mb-12">
        <p className="text-gray-600 text-lg tracking-wide mb-2">baynunah<span className="text-emerald-500">.</span></p>
        <h1 className="text-4xl font-light tracking-widest text-gray-800">HR PORTAL</h1>
        <p className="text-gray-500 mt-4">Securely manage employee contract renewals and onboarding</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-80">
        <button
          onClick={() => setActiveSection('employees')}
          className="bg-white rounded-tl-[4rem] rounded-tr-lg rounded-bl-lg rounded-br-lg shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow aspect-square"
        >
          <svg className="w-10 h-10 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Employees</span>
        </button>

        <button
          onClick={() => setActiveSection('onboarding')}
          className="bg-white rounded-tr-[4rem] rounded-tl-lg rounded-bl-lg rounded-br-lg shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow aspect-square"
        >
          <svg className="w-10 h-10 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Onboarding</span>
        </button>

        <button
          onClick={() => setActiveSection('external')}
          className="bg-white rounded-bl-[4rem] rounded-tl-lg rounded-tr-lg rounded-br-lg shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow aspect-square"
        >
          <svg className="w-10 h-10 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide text-center">External<br/>Users</span>
        </button>

        <button
          onClick={() => setActiveSection('admin')}
          className="bg-white rounded-br-[4rem] rounded-tl-lg rounded-tr-lg rounded-bl-lg shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow aspect-square"
        >
          <svg className="w-10 h-10 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Admin</span>
        </button>
      </div>
    </div>
  )
}

// Employees section with renewal management
function EmployeesSection({ token }: { token: string }) {
  const [renewals, setRenewals] = useState<RenewalResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<RenewalRequest>({
    employee_name: '',
    contract_end_date: '',
    renewal_period_months: 12
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchRenewals = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listRenewals(token)
      setRenewals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch renewals')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createRenewal(token, formData)
      setShowForm(false)
      setFormData({ employee_name: '', contract_end_date: '', renewal_period_months: 12 })
      await fetchRenewals()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create renewal')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetchRenewals()
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Contract Renewals</h2>
          <p className="text-gray-500">Manage employee contract renewal requests</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchRenewals}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Renewal
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* New Renewal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">New Renewal Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                <input
                  type="text"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract End Date</label>
                <input
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Period (months)</label>
                <select
                  value={formData.renewal_period_months}
                  onChange={(e) => setFormData({ ...formData, renewal_period_months: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                  <option value={36}>36 months</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renewals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renewal Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <svg className="animate-spin h-8 w-8 mx-auto text-emerald-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2">Loading renewals...</p>
                </td>
              </tr>
            ) : renewals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No renewal requests found</p>
                  <p className="text-sm text-gray-400 mt-1">Create a new renewal request to get started</p>
                </td>
              </tr>
            ) : (
              renewals.map((renewal) => (
                <tr key={renewal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{renewal.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{renewal.employee_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{renewal.contract_end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{renewal.renewal_period_months} months</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      renewal.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : renewal.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {renewal.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Onboarding section
function OnboardingSection() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Onboarding</h2>
        <p className="text-gray-500">Manage new employee onboarding and compliance checks</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Onboarding Module</h3>
        <p className="text-gray-500 mb-4">This module is under development. Coming soon!</p>
        <div className="flex justify-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">0</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">0</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">0</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// External Users section
function ExternalUsersSection() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">External Users</h2>
        <p className="text-gray-500">Manage contractor and vendor access</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <h3 className="text-lg font-medium text-gray-800 mb-2">External Users Module</h3>
        <p className="text-gray-500 mb-4">Manage contractors, vendors, and external collaborators. Coming soon!</p>
        <div className="flex justify-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">0</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">0</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">0</div>
            <div className="text-sm text-gray-500">Expired</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Login Section
function LoginSection({ onLogin }: { onLogin: (session: UserSession) => void }) {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await login({ employee_id: employeeId, password })
      onLogin({
        token: response.access_token,
        employeeId: response.employee_id,
        name: response.name,
        role: response.role,
        requiresPasswordChange: response.requires_password_change,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-gray-600 text-lg tracking-wide mb-2">baynunah<span className="text-emerald-500">.</span></p>
          <h1 className="text-3xl font-light tracking-widest text-gray-800">HR PORTAL</h1>
          <p className="text-gray-500 mt-4">Sign in with your Employee ID</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g., EMP001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">First-time login? Use your date of birth (DDMMYYYY)</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">Secure Renewals v1.0</p>
      </div>
    </div>
  )
}

// Password Change Modal
function PasswordChangeModal({ token, onComplete, onLogout }: { 
  token: string
  onComplete: () => void
  onLogout: () => void 
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await changePassword(token, { current_password: currentPassword, new_password: newPassword })
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Change Your Password</h2>
        <p className="text-gray-500 mb-6">You must set a new password before continuing.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Your current password (DOB)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-400 mt-1">Must include uppercase, lowercase, and a number</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Admin section
function AdminSection({ token }: { token: string }) {
  const [health, setHealth] = useState<{ status: string; role: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getHealth(token)
      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Admin</h2>
        <p className="text-gray-500">System administration and monitoring</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Health Check */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">API Health Check</h3>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 mb-4"
          >
            {loading ? 'Checking...' : 'Check API Health'}
          </button>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          {health && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg">
              <p><strong>Status:</strong> {health.status}</p>
              <p><strong>Role:</strong> {health.role}</p>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">System Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Version</span>
              <span className="text-gray-800 font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Environment</span>
              <span className="text-gray-800 font-medium">Development</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">API Base URL</span>
              <span className="text-gray-800 font-medium text-xs">Configured</span>
            </div>
          </div>
        </div>

        {/* Role Permissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Role Permissions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">View Renewals</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Create Renewals</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Auto-Approve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">Admin</td>
                  <td className="px-4 py-3 text-center text-green-500">✓</td>
                  <td className="px-4 py-3 text-center text-green-500">✓</td>
                  <td className="px-4 py-3 text-center text-green-500">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">HR</td>
                  <td className="px-4 py-3 text-center text-green-500">✓</td>
                  <td className="px-4 py-3 text-center text-green-500">✓</td>
                  <td className="px-4 py-3 text-center text-gray-300">✗</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">Viewer</td>
                  <td className="px-4 py-3 text-center text-green-500">✓</td>
                  <td className="px-4 py-3 text-center text-gray-300">✗</td>
                  <td className="px-4 py-3 text-center text-gray-300">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main App component
function App() {
  const [activeSection, setActiveSection] = useState<Section>('home')
  const [session, setSession] = useState<UserSession | null>(null)

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession)
  }

  const handleLogout = () => {
    setSession(null)
    setActiveSection('home')
  }

  const handlePasswordChanged = () => {
    if (session) {
      setSession({ ...session, requiresPasswordChange: false })
    }
  }

  // Show login screen if not authenticated
  if (!session) {
    return <LoginSection onLogin={handleLogin} />
  }

  // Show password change modal if required
  if (session.requiresPasswordChange) {
    return (
      <>
        <LoginSection onLogin={handleLogin} />
        <PasswordChangeModal 
          token={session.token} 
          onComplete={handlePasswordChanged}
          onLogout={handleLogout}
        />
      </>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <HomeSection setActiveSection={setActiveSection} />
      case 'employees':
        return <EmployeesSection token={session.token} />
      case 'onboarding':
        return <OnboardingSection />
      case 'external':
        return <ExternalUsersSection />
      case 'admin':
        return <AdminSection token={session.token} />
      default:
        return <HomeSection setActiveSection={setActiveSection} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <div className="flex-1 flex flex-col">
        {/* Header with user info */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800 capitalize">
              {activeSection === 'external' ? 'External Users' : activeSection}
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{session.name}</p>
                  <p className="text-xs text-gray-500">{session.role.toUpperCase()} • {session.employeeId}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
                  {session.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}

export default App
