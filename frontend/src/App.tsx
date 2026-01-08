import { useState, useEffect } from 'react'
import { GlassLoader } from './components/GlassLoader'
import { TemplateList } from './components/Templates/TemplateList'
import { EmployeeProfile } from './components/EmployeeProfile'
import { CandidatePass } from './components/CandidatePass'
import { ManagerPass } from './components/ManagerPass'
import { Performance } from './components/Performance'
import { EoyNominations } from './components/EoyNominations'
import { InsuranceCensus } from './components/InsuranceCensus'

type Section = 'home' | 'employees' | 'onboarding' | 'external' | 'admin' | 'secret-chamber' | 'passes' | 'public-onboarding' | 'recruitment' | 'recruitment-request' | 'recruitment-benefits' | 'templates' | 'template-manager' | 'template-candidate' | 'template-onboarding' | 'template-employee' | 'attendance' | 'compliance-alerts' | 'candidate-pass' | 'manager-pass' | 'performance' | 'insurance-census'

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
  // UAE Compliance fields
  visa_number?: string
  visa_issue_date?: string
  visa_expiry_date?: string
  emirates_id_number?: string
  emirates_id_expiry?: string
  medical_fitness_date?: string
  medical_fitness_expiry?: string
  iloe_status?: string
  iloe_expiry?: string
  contract_type?: string
  contract_start_date?: string
  contract_end_date?: string
  nationality?: string
  gender?: string
  joining_date?: string
  line_manager_name?: string
}

interface EmployeeFormData {
  name: string
  email: string
  department: string
  job_title: string
  location: string
  nationality: string
  gender: string
  employment_status: string
  visa_number: string
  visa_issue_date: string
  visa_expiry_date: string
  emirates_id_number: string
  emirates_id_expiry: string
  medical_fitness_date: string
  medical_fitness_expiry: string
  iloe_status: string
  iloe_expiry: string
  contract_type: string
  contract_start_date: string
  contract_end_date: string
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

interface TodayAttendanceStatus {
  date: string
  is_clocked_in: boolean
  clock_in_time: string | null
  is_on_break: boolean
  break_start_time: string | null
  work_type: string | null
  can_clock_in: boolean
  can_clock_out: boolean
  can_start_break: boolean
  can_end_break: boolean
  message: string
}

interface AttendanceRecord {
  id: number
  employee_id: number
  employee_name: string
  attendance_date: string
  clock_in: string | null
  clock_out: string | null
  work_type: string
  total_hours: number | null
  regular_hours: number | null
  overtime_hours: number | null
  status: string
  is_late: boolean
  late_minutes: number | null
  is_early_departure: boolean
  notes: string | null
}

interface AttendanceDashboard {
  total_employees: number
  clocked_in_today: number
  wfh_today: number
  absent_today: number
  late_today: number
  pending_wfh_approvals: number
  pending_overtime_approvals: number
  on_leave_today: number
}

interface ComplianceAlertItem {
  employee_id: string
  employee_name: string
  document_type: string
  expiry_date: string
  days_until_expiry: number
  status: string
}

interface ComplianceAlerts {
  expired: ComplianceAlertItem[]
  days_7: ComplianceAlertItem[]
  days_30: ComplianceAlertItem[]
  days_custom: ComplianceAlertItem[]
}

const API_BASE = '/api'

function App() {
  const [activeSection, setActiveSection] = useState<Section>('home')
  const [adminTab, setAdminTab] = useState<'dashboard' | 'employees' | 'compliance' | 'recruitment' | 'evaluation'>('dashboard')
  const [adminEmployeeSearch, setAdminEmployeeSearch] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [features, setFeatures] = useState<FeatureToggle[]>([])
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [chamberLoading, setChamberLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
  const [passFilter, setPassFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all')
  const [viewingPass, setViewingPass] = useState<Pass | null>(null)
  
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
  
  // Attendance state
  const [attendanceStatus, setAttendanceStatus] = useState<TodayAttendanceStatus | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceDashboard, setAttendanceDashboard] = useState<AttendanceDashboard | null>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [clockInWorkType, setClockInWorkType] = useState<'office' | 'wfh' | 'field'>('office')
  const [wfhReason, setWfhReason] = useState('')
  const [gpsCoords, setGpsCoords] = useState<{latitude: number, longitude: number} | null>(null)

  // Compliance alerts state
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlerts | null>(null)
  const [complianceAlertsLoading, setComplianceAlertsLoading] = useState(false)
  const [recruitmentRequests, setRecruitmentRequests] = useState<any[]>([])
  const [recruitmentStats, setRecruitmentStats] = useState<{active_positions: number, total_candidates: number, in_interview: number, hired_30_days: number} | null>(null)
  const [pipelineCounts, setPipelineCounts] = useState<{applied: number, screening: number, interview: number, offer: number, hired: number} | null>(null)
  const [candidatesList, setCandidatesList] = useState<any[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null)
  const [showCandidateProfileModal, setShowCandidateProfileModal] = useState(false)
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('')
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('')
  const [candidateSourceFilter, setCandidateSourceFilter] = useState('')
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [newRequestForm, setNewRequestForm] = useState({
    position_title: '',
    department: 'Engineering / R&D',
    employment_type: 'Full-time',
    salary_range_min: '',
    salary_range_max: '',
    headcount: '1',
    job_description: '',
    requirements: ''
  })

  // Employee management state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [employeeFormData, setEmployeeFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    department: '',
    job_title: '',
    location: '',
    nationality: '',
    gender: '',
    employment_status: '',
    visa_number: '',
    visa_issue_date: '',
    visa_expiry_date: '',
    emirates_id_number: '',
    emirates_id_expiry: '',
    medical_fitness_date: '',
    medical_fitness_expiry: '',
    iloe_status: '',
    iloe_expiry: '',
    contract_type: '',
    contract_start_date: '',
    contract_end_date: '',
  })
  const [employeeModalLoading, setEmployeeModalLoading] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{created: number, skipped: number, errors: string[]} | null>(null)
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null)
  
  // Candidate/Manager Pass state
  const [viewingCandidatePassId, setViewingCandidatePassId] = useState<number | null>(null)
  const [viewingManagerPassPositionId, setViewingManagerPassPositionId] = useState<number | null>(null)
  const [viewingManagerId, setViewingManagerId] = useState<string>('')

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
    const isFormData = options.body instanceof FormData
    const headers: Record<string, string> = {
      // Don't set Content-Type for FormData - browser will set it with boundary
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

  const openEmployeeModal = async (emp: Employee) => {
    setSelectedEmployee(emp)
    setEmployeeFormData({
      name: emp.name || '',
      email: emp.email || '',
      department: emp.department || '',
      job_title: emp.job_title || '',
      location: emp.location || '',
      nationality: emp.nationality || '',
      gender: emp.gender || '',
      employment_status: emp.employment_status || '',
      visa_number: emp.visa_number || '',
      visa_issue_date: emp.visa_issue_date || '',
      visa_expiry_date: emp.visa_expiry_date || '',
      emirates_id_number: emp.emirates_id_number || '',
      emirates_id_expiry: emp.emirates_id_expiry || '',
      medical_fitness_date: emp.medical_fitness_date || '',
      medical_fitness_expiry: emp.medical_fitness_expiry || '',
      iloe_status: emp.iloe_status || '',
      iloe_expiry: emp.iloe_expiry || '',
      contract_type: emp.contract_type || '',
      contract_start_date: emp.contract_start_date || '',
      contract_end_date: emp.contract_end_date || '',
    })
    setShowEmployeeModal(true)
    setError(null)
  }

  const closeEmployeeModal = () => {
    setShowEmployeeModal(false)
    setSelectedEmployee(null)
    setError(null)
  }

  const updateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return
    
    setEmployeeModalLoading(true)
    setError(null)
    
    try {
      const updateData: Record<string, string> = {}
      // Only send non-empty string fields
      Object.entries(employeeFormData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() !== '') {
          updateData[key] = value
        }
      })
      
      const res = await fetchWithAuth(`${API_BASE}/employees/${selectedEmployee.employee_id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to update employee')
      }
      
      // Refresh employees list
      await fetchEmployees()
      closeEmployeeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee')
    } finally {
      setEmployeeModalLoading(false)
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImportLoading(true)
    setImportResult(null)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetchWithAuth(`${API_BASE}/employees/import`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Import failed')
      }
      
      const result = await res.json()
      setImportResult(result)
      
      // Refresh employees list
      await fetchEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import employees')
    } finally {
      setImportLoading(false)
      // Reset file input
      e.target.value = ''
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

  const fetchComplianceAlerts = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) return
    setComplianceAlertsLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE}/employees/compliance/alerts`)
      if (res.ok) {
        const data = await res.json()
        setComplianceAlerts(data)
      }
    } catch (err) {
      console.error('Failed to fetch compliance alerts:', err)
    } finally {
      setComplianceAlertsLoading(false)
    }
  }

  const fetchRecruitmentData = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) return
    try {
      const [statsRes, requestsRes, pipelineRes, candidatesRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/recruitment/stats`),
        fetchWithAuth(`${API_BASE}/recruitment/requests`),
        fetchWithAuth(`${API_BASE}/recruitment/pipeline`),
        fetchWithAuth(`${API_BASE}/recruitment/candidates`)
      ])
      if (statsRes.ok) setRecruitmentStats(await statsRes.json())
      if (requestsRes.ok) setRecruitmentRequests(await requestsRes.json())
      if (pipelineRes.ok) setPipelineCounts(await pipelineRes.json())
      if (candidatesRes.ok) setCandidatesList(await candidatesRes.json())
    } catch (err) {
      console.error('Failed to fetch recruitment data:', err)
    }
  }

  const handleCreateRecruitmentRequest = async () => {
    if (!user) return
    setLoading(true)
    try {
      const payload = {
        position_title: newRequestForm.position_title,
        department: newRequestForm.department,
        employment_type: newRequestForm.employment_type,
        salary_range_min: newRequestForm.salary_range_min ? parseFloat(newRequestForm.salary_range_min) : null,
        salary_range_max: newRequestForm.salary_range_max ? parseFloat(newRequestForm.salary_range_max) : null,
        headcount: parseInt(newRequestForm.headcount) || 1,
        job_description: newRequestForm.job_description || null,
        requirements: newRequestForm.requirements || null
      }
      const res = await fetchWithAuth(`${API_BASE}/recruitment/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setShowNewRequestModal(false)
        setNewRequestForm({
          position_title: '',
          department: 'Engineering / R&D',
          employment_type: 'Full-time',
          salary_range_min: '',
          salary_range_max: '',
          headcount: '1',
          job_description: '',
          requirements: ''
        })
        fetchRecruitmentData()
      } else {
        const err = await res.json()
        alert(err.detail || 'Failed to create recruitment request')
      }
    } catch (err) {
      console.error('Failed to create recruitment request:', err)
      alert('Failed to create recruitment request')
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

  // Attendance functions
  const fetchAttendanceData = async () => {
    if (!user) return
    setAttendanceLoading(true)
    try {
      const [statusRes, recordsRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/attendance/today`),
        fetchWithAuth(`${API_BASE}/attendance/my-records`)
      ])
      if (statusRes.ok) {
        setAttendanceStatus(await statusRes.json())
      }
      if (recordsRes.ok) {
        setAttendanceRecords(await recordsRes.json())
      }
      if (user.role === 'admin' || user.role === 'hr') {
        const dashRes = await fetchWithAuth(`${API_BASE}/attendance/dashboard`)
        if (dashRes.ok) {
          setAttendanceDashboard(await dashRes.json())
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance data:', err)
    } finally {
      setAttendanceLoading(false)
    }
  }

  const requestGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (err) => {
          console.warn('GPS location not available:', err.message)
          setGpsCoords(null)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }

  const handleClockIn = async () => {
    if (!user) return
    setAttendanceLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        work_type: clockInWorkType,
        latitude: gpsCoords?.latitude,
        longitude: gpsCoords?.longitude,
      }
      if (clockInWorkType === 'wfh' && wfhReason) {
        body.wfh_reason = wfhReason
      }
      const res = await fetchWithAuth(`${API_BASE}/attendance/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to clock in')
      }
      await fetchAttendanceData()
      setClockInWorkType('office')
      setWfhReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock in')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!user) return
    setAttendanceLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuth(`${API_BASE}/attendance/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: gpsCoords?.latitude,
          longitude: gpsCoords?.longitude,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to clock out')
      }
      await fetchAttendanceData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock out')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleBreakStart = async () => {
    if (!user) return
    setAttendanceLoading(true)
    try {
      await fetchWithAuth(`${API_BASE}/attendance/break/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      await fetchAttendanceData()
    } catch (err) {
      console.error('Failed to start break:', err)
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleBreakEnd = async () => {
    if (!user) return
    setAttendanceLoading(true)
    try {
      await fetchWithAuth(`${API_BASE}/attendance/break/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      await fetchAttendanceData()
    } catch (err) {
      console.error('Failed to end break:', err)
    } finally {
      setAttendanceLoading(false)
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
    } else if (activeSection === 'onboarding' && user && (user.role === 'admin' || user.role === 'hr')) {
      fetchOnboardingData()
    } else if (activeSection === 'attendance' && user) {
      fetchAttendanceData()
      requestGPSLocation()
    } else if (activeSection === 'compliance-alerts' && user && (user.role === 'admin' || user.role === 'hr')) {
      fetchComplianceAlerts()
    }
  }, [activeSection, user])

  // Fetch data when admin tab changes
  useEffect(() => {
    if (activeSection === 'admin' && user?.role === 'admin') {
      if (adminTab === 'employees') {
        fetchEmployees()
      } else if (adminTab === 'compliance') {
        fetchComplianceAlerts()
      } else if (adminTab === 'recruitment') {
        fetchRecruitmentData()
      }
    }
  }, [adminTab, activeSection, user])

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
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={isAdminLogin ? 'Enter admin password' : 'First login: DOB as DDMMYYYY'}
                required
                autoComplete="current-password"
                data-testid="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-submit w-full"
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

  // Universal loader for all loading states
  if (loading || passesLoading || onboardingLoading || attendanceLoading || chamberLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <GlassLoader />
      </div>
    )
  }

  // Public Onboarding Page (for new joiners)
  if (activeSection === 'public-onboarding') {

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
                  className="btn-submit w-full"
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
        
        {/* Employee Profile Modal */}
        {viewingProfileId && user?.token && (
          <EmployeeProfile
            employeeId={viewingProfileId}
            token={user.token}
            currentUserRole={user.role}
            currentUserId={user.employee_id}
            onClose={() => setViewingProfileId(null)}
          />
        )}
        
        {/* Employee Edit Modal */}
        {showEmployeeModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Edit Employee</h2>
                    <p className="text-sm text-gray-500">{selectedEmployee.employee_id}</p>
                  </div>
                  <button
                    onClick={closeEmployeeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="mx-6 mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
              )}
              
              <form onSubmit={updateEmployee} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={employeeFormData.name}
                        onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={employeeFormData.email}
                        onChange={e => setEmployeeFormData({...employeeFormData, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={employeeFormData.department}
                        onChange={e => setEmployeeFormData({...employeeFormData, department: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={employeeFormData.job_title}
                        onChange={e => setEmployeeFormData({...employeeFormData, job_title: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={employeeFormData.location}
                        onChange={e => setEmployeeFormData({...employeeFormData, location: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                      <input
                        type="text"
                        value={employeeFormData.nationality}
                        onChange={e => setEmployeeFormData({...employeeFormData, nationality: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={employeeFormData.gender}
                        onChange={e => setEmployeeFormData({...employeeFormData, gender: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                      <select
                        value={employeeFormData.employment_status}
                        onChange={e => setEmployeeFormData({...employeeFormData, employment_status: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="Active">Active</option>
                        <option value="Probation">Probation</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Resigned">Resigned</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* UAE Compliance - Visa */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Visa Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visa Number</label>
                      <input
                        type="text"
                        value={employeeFormData.visa_number}
                        onChange={e => setEmployeeFormData({...employeeFormData, visa_number: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                      <input
                        type="date"
                        value={employeeFormData.visa_issue_date}
                        onChange={e => setEmployeeFormData({...employeeFormData, visa_issue_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={employeeFormData.visa_expiry_date}
                        onChange={e => setEmployeeFormData({...employeeFormData, visa_expiry_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* UAE Compliance - Emirates ID */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    Emirates ID
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emirates ID Number</label>
                      <input
                        type="text"
                        value={employeeFormData.emirates_id_number}
                        onChange={e => setEmployeeFormData({...employeeFormData, emirates_id_number: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="784-XXXX-XXXXXXX-X"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={employeeFormData.emirates_id_expiry}
                        onChange={e => setEmployeeFormData({...employeeFormData, emirates_id_expiry: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* UAE Compliance - Medical & ILOE */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Medical & Insurance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medical Fitness Date</label>
                      <input
                        type="date"
                        value={employeeFormData.medical_fitness_date}
                        onChange={e => setEmployeeFormData({...employeeFormData, medical_fitness_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medical Fitness Expiry</label>
                      <input
                        type="date"
                        value={employeeFormData.medical_fitness_expiry}
                        onChange={e => setEmployeeFormData({...employeeFormData, medical_fitness_expiry: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ILOE Status</label>
                      <select
                        value={employeeFormData.iloe_status}
                        onChange={e => setEmployeeFormData({...employeeFormData, iloe_status: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Expired">Expired</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ILOE Expiry</label>
                      <input
                        type="date"
                        value={employeeFormData.iloe_expiry}
                        onChange={e => setEmployeeFormData({...employeeFormData, iloe_expiry: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contract Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Contract Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                      <select
                        value={employeeFormData.contract_type}
                        onChange={e => setEmployeeFormData({...employeeFormData, contract_type: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="Limited">Limited</option>
                        <option value="Unlimited">Unlimited</option>
                        <option value="Fixed Term">Fixed Term</option>
                        <option value="Probation">Probation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={employeeFormData.contract_start_date}
                        onChange={e => setEmployeeFormData({...employeeFormData, contract_start_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={employeeFormData.contract_end_date}
                        onChange={e => setEmployeeFormData({...employeeFormData, contract_end_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeEmployeeModal}
                    className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={employeeModalLoading}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
                  >
                    {employeeModalLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
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
          
          {/* Instructions and Import */}
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex-1">
                <p className="text-emerald-700 text-sm">
                  <strong>Tip:</strong> Click on any employee row to view and edit their details including UAE compliance information.
                </p>
              </div>
              <div className="flex gap-2">
                <label className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {importLoading ? 'Importing...' : 'Import CSV'}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                    disabled={importLoading}
                  />
                </label>
              </div>
            </div>
          )}
          
          {/* Import Result */}
          {importResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">Import Complete</h4>
              <p className="text-blue-700 text-sm">
                <strong>{importResult.created}</strong> employees created, 
                <strong> {importResult.skipped}</strong> skipped (already exist)
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 text-red-600 text-sm">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc pl-5">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {importResult.errors.length > 5 && <li>...and {importResult.errors.length - 5} more</li>}
                  </ul>
                </div>
              )}
              <button 
                onClick={() => setImportResult(null)}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
          {/* Error Display */}
          {error && !showEmployeeModal && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-red-600 text-sm hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map(emp => (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => (user?.role === 'admin' || user?.role === 'hr') && openEmployeeModal(emp)}
                    >
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewingProfileId(emp.employee_id)
                            }}
                            className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            View
                          </button>
                          {(user?.role === 'admin' || user?.role === 'hr') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEmployeeModal(emp)
                              }}
                              className="px-3 py-1 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                          )}
                        </div>
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
        {viewingProfileId && user?.token && (
          <EmployeeProfile
            employeeId={viewingProfileId}
            token={user.token}
            currentUserRole={user.role}
            currentUserId={user.employee_id}
            onClose={() => setViewingProfileId(null)}
          />
        )}
        
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

        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <img src="/assets/logo.png" alt="Baynunah" className="h-6 mb-1" />
              <h1 className="text-2xl font-semibold text-gray-800">Admin Section</h1>
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

          {/* Admin Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  adminTab === 'dashboard'
                    ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  Dashboard
                </div>
              </button>
              <button
                onClick={() => setAdminTab('employees')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  adminTab === 'employees'
                    ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Employees ({employees.length})
                </div>
              </button>
              <button
                onClick={() => setAdminTab('compliance')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  adminTab === 'compliance'
                    ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Compliance Alerts
                  {complianceAlerts && (complianceAlerts.expired.length + (complianceAlerts.days_7?.length || 0)) > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {complianceAlerts.expired.length + (complianceAlerts.days_7?.length || 0)}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setAdminTab('recruitment')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  adminTab === 'recruitment'
                    ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Recruitment
                </div>
              </button>
              <button
                onClick={() => setAdminTab('evaluation')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  adminTab === 'evaluation'
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Evaluation
                </div>
              </button>
            </div>
          </div>

          {/* Dashboard Tab Content */}
          {adminTab === 'dashboard' && (
            <>
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
                    onClick={() => setAdminTab('employees')}
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
                  <button 
                    onClick={() => setAdminTab('compliance')}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <svg className="w-8 h-8 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="font-medium text-gray-800">Compliance Alerts</p>
                    <p className="text-sm text-gray-500">Document expiry warnings</p>
                  </button>
                  <button 
                    onClick={() => setActiveSection('templates')}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <svg className="w-8 h-8 text-indigo-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <p className="font-medium text-gray-800">Templates</p>
                    <p className="text-sm text-gray-500">Pass templates</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Employees Tab Content */}
          {adminTab === 'employees' && (
            <>
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search employees by name, ID, or job title..."
                        value={adminEmployeeSearch}
                        onChange={e => setAdminEmployeeSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employees Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <h2 className="text-lg font-semibold text-gray-800">Employee Directory</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {employees.filter(e => 
                      e.name.toLowerCase().includes(adminEmployeeSearch.toLowerCase()) ||
                      e.employee_id.toLowerCase().includes(adminEmployeeSearch.toLowerCase()) ||
                      (e.job_title || '').toLowerCase().includes(adminEmployeeSearch.toLowerCase())
                    ).length} employees found
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 text-left">Employee</th>
                        <th className="px-6 py-3 text-left">ID</th>
                        <th className="px-6 py-3 text-left">Job Title</th>
                        <th className="px-6 py-3 text-left">Department</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {employees
                        .filter(e => 
                          e.name.toLowerCase().includes(adminEmployeeSearch.toLowerCase()) ||
                          e.employee_id.toLowerCase().includes(adminEmployeeSearch.toLowerCase()) ||
                          (e.job_title || '').toLowerCase().includes(adminEmployeeSearch.toLowerCase())
                        )
                        .slice(0, 50)
                        .map(emp => (
                          <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium">
                                  {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{emp.name}</p>
                                  <p className="text-sm text-gray-500">{emp.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-mono">{emp.employee_id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.job_title || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.function || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                emp.status === 'active' ? 'bg-green-100 text-green-800' : 
                                emp.status === 'on_leave' ? 'bg-amber-100 text-amber-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setViewingProfileId(emp.employee_id)}
                                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Compliance Tab Content */}
          {adminTab === 'compliance' && (
            <>
              {complianceAlertsLoading ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading compliance alerts...</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-lg">!</div>
                        <div>
                          <p className="text-2xl font-bold text-red-700">{complianceAlerts?.expired.length || 0}</p>
                          <p className="text-xs text-red-600">Expired</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-lg">!</div>
                        <div>
                          <p className="text-2xl font-bold text-orange-700">{complianceAlerts?.days_7?.length || 0}</p>
                          <p className="text-xs text-orange-600">Within 7 days</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 text-lg">!</div>
                        <div>
                          <p className="text-2xl font-bold text-yellow-700">{complianceAlerts?.days_30?.length || 0}</p>
                          <p className="text-xs text-yellow-600">Within 30 days</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-lg">!</div>
                        <div>
                          <p className="text-2xl font-bold text-amber-700">{complianceAlerts?.days_custom?.length || 0}</p>
                          <p className="text-xs text-amber-600">Within 60 days</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expired Documents */}
                  {complianceAlerts?.expired && complianceAlerts.expired.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg mb-6">
                      <div className="px-6 py-4 border-b border-gray-100 bg-red-50 rounded-t-xl">
                        <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                          <span>!</span> Expired Documents ({complianceAlerts.expired.length})
                        </h2>
                        <p className="text-sm text-red-600 mt-1">These documents need immediate attention</p>
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-6 py-3 text-left">Employee</th>
                            <th className="px-6 py-3 text-left">Document</th>
                            <th className="px-6 py-3 text-left">Expiry Date</th>
                            <th className="px-6 py-3 text-left">Days Overdue</th>
                            <th className="px-6 py-3 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {complianceAlerts.expired.map((alert, idx) => (
                            <tr key={`expired-${idx}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-800">{alert.employee_name}</p>
                                <p className="text-sm text-gray-500">{alert.employee_id}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{alert.document_type}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{alert.expiry_date}</td>
                              <td className="px-6 py-4">
                                <span className="text-red-600 font-medium">{Math.abs(alert.days_until_expiry)} days overdue</span>
                              </td>
                              <td className="px-6 py-4">
                                <button onClick={() => setViewingProfileId(alert.employee_id)} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Expiring in 7 Days */}
                  {complianceAlerts?.days_7 && complianceAlerts.days_7.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg mb-6">
                      <div className="px-6 py-4 border-b border-gray-100 bg-orange-50 rounded-t-xl">
                        <h2 className="text-lg font-semibold text-orange-700 flex items-center gap-2">
                          <span>!</span> Expiring Within 7 Days ({complianceAlerts.days_7.length})
                        </h2>
                        <p className="text-sm text-orange-600 mt-1">Urgent - documents that need immediate attention</p>
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-6 py-3 text-left">Employee</th>
                            <th className="px-6 py-3 text-left">Document</th>
                            <th className="px-6 py-3 text-left">Expiry Date</th>
                            <th className="px-6 py-3 text-left">Days Left</th>
                            <th className="px-6 py-3 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {complianceAlerts.days_7.map((alert, idx) => (
                            <tr key={`days7-${idx}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-800">{alert.employee_name}</p>
                                <p className="text-sm text-gray-500">{alert.employee_id}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{alert.document_type}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{alert.expiry_date}</td>
                              <td className="px-6 py-4">
                                <span className="text-orange-600 font-medium">{alert.days_until_expiry} days</span>
                              </td>
                              <td className="px-6 py-4">
                                <button onClick={() => setViewingProfileId(alert.employee_id)} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Expiring in 30 Days */}
                  {complianceAlerts?.days_30 && complianceAlerts.days_30.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg mb-6">
                      <div className="px-6 py-4 border-b border-gray-100 bg-yellow-50 rounded-t-xl">
                        <h2 className="text-lg font-semibold text-yellow-700 flex items-center gap-2">
                          <span>!</span> Expiring Within 30 Days ({complianceAlerts.days_30.length})
                        </h2>
                        <p className="text-sm text-yellow-600 mt-1">Documents that need to be renewed soon</p>
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-6 py-3 text-left">Employee</th>
                            <th className="px-6 py-3 text-left">Document</th>
                            <th className="px-6 py-3 text-left">Expiry Date</th>
                            <th className="px-6 py-3 text-left">Days Left</th>
                            <th className="px-6 py-3 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {complianceAlerts.days_30.map((alert, idx) => (
                            <tr key={`days30-${idx}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-800">{alert.employee_name}</p>
                                <p className="text-sm text-gray-500">{alert.employee_id}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{alert.document_type}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{alert.expiry_date}</td>
                              <td className="px-6 py-4">
                                <span className="text-yellow-600 font-medium">{alert.days_until_expiry} days</span>
                              </td>
                              <td className="px-6 py-4">
                                <button onClick={() => setViewingProfileId(alert.employee_id)} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Expiring in 60 Days */}
                  {complianceAlerts?.days_custom && complianceAlerts.days_custom.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg mb-6">
                      <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 rounded-t-xl">
                        <h2 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
                          <span>!</span> Expiring Within 60 Days ({complianceAlerts.days_custom.length})
                        </h2>
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-6 py-3 text-left">Employee</th>
                            <th className="px-6 py-3 text-left">Document</th>
                            <th className="px-6 py-3 text-left">Expiry Date</th>
                            <th className="px-6 py-3 text-left">Days Left</th>
                            <th className="px-6 py-3 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {complianceAlerts.days_custom.map((alert, idx) => (
                            <tr key={`days60-${idx}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-800">{alert.employee_name}</p>
                                <p className="text-sm text-gray-500">{alert.employee_id}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{alert.document_type}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{alert.expiry_date}</td>
                              <td className="px-6 py-4">
                                <span className="text-amber-600 font-medium">{alert.days_until_expiry} days</span>
                              </td>
                              <td className="px-6 py-4">
                                <button onClick={() => setViewingProfileId(alert.employee_id)} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* No Alerts */}
                  {complianceAlerts && (complianceAlerts.expired.length + (complianceAlerts.days_7?.length || 0) + (complianceAlerts.days_30?.length || 0) + (complianceAlerts.days_custom?.length || 0)) === 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                      <p className="text-4xl mb-4">All Clear!</p>
                      <p className="text-xl font-semibold text-emerald-600 mb-2">No Compliance Issues</p>
                      <p className="text-gray-600">No documents are expired or expiring within the next 60 days.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Recruitment Tab Content */}
          {adminTab === 'recruitment' && (
            <div className="space-y-6">
              {/* Recruitment Dashboard Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Positions</p>
                      <p className="text-3xl font-semibold text-purple-600">{recruitmentStats?.active_positions ?? recruitmentRequests.length}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Candidates</p>
                      <p className="text-3xl font-semibold text-blue-600">{recruitmentStats?.total_candidates ?? 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">In Interview</p>
                      <p className="text-3xl font-semibold text-orange-600">{recruitmentStats?.in_interview ?? pipelineCounts?.interview ?? 0}</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Hired (30 days)</p>
                      <p className="text-3xl font-semibold text-emerald-600">{recruitmentStats?.hired_30_days ?? pipelineCounts?.hired ?? 0}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Job Positions */}
              {recruitmentRequests.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Open Positions ({recruitmentRequests.length})
                  </h2>
                  <div className="grid gap-4">
                    {recruitmentRequests.map((req: any) => (
                      <div key={req.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">{req.position_title}</h3>
                            <p className="text-sm text-gray-500">{req.department} • {req.employment_type}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                req.status === 'open' ? 'bg-green-100 text-green-700' :
                                req.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {req.status?.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-400">{req.request_number}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Headcount: {req.headcount || 1}</p>
                              {req.salary_range_min && req.salary_range_max && (
                                <p className="text-xs text-gray-400">AED {req.salary_range_min.toLocaleString()} - {req.salary_range_max.toLocaleString()}</p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setViewingManagerPassPositionId(req.id)
                                setViewingManagerId(req.hiring_manager_id || user?.employee_id || '')
                                setActiveSection('manager-pass')
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                              Manager Pass
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kanban Pipeline */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Candidate Pipeline
                </h2>
                
                {/* Pipeline Stages */}
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { key: 'applied', label: 'Applied' },
                    { key: 'screening', label: 'Screening' },
                    { key: 'interview', label: 'Interview' },
                    { key: 'offer', label: 'Offer' },
                    { key: 'hired', label: 'Hired' }
                  ].map((stage) => (
                    <div key={stage.key} className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-700">{stage.label}</h3>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {pipelineCounts?.[stage.key as keyof typeof pipelineCounts] ?? 0}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(pipelineCounts?.[stage.key as keyof typeof pipelineCounts] ?? 0) === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            <p>No candidates</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Candidates Screening Table - Improved Spacing */}
              {candidatesList.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  {/* Header with Search and Filters */}
                  <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Candidate Screening</h2>
                        <p className="text-sm text-gray-500 mt-1">{candidatesList.length} candidates in pipeline</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Search candidates..."
                            value={candidateSearchQuery}
                            onChange={(e) => setCandidateSearchQuery(e.target.value)}
                            className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                          />
                        </div>
                        <select 
                          value={candidateStatusFilter}
                          onChange={(e) => setCandidateStatusFilter(e.target.value)}
                          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                          <option value="">All Stages</option>
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="hired">Hired</option>
                        </select>
                        <select 
                          value={candidateSourceFilter}
                          onChange={(e) => setCandidateSourceFilter(e.target.value)}
                          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                          <option value="">All Sources</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Indeed">Indeed</option>
                          <option value="Referral">Referral</option>
                          <option value="Direct">Direct Application</option>
                          <option value="Agency">Agency</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Screening Table - Better Spacing */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="py-4 px-3 text-left w-12">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </th>
                          <th className="py-4 px-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Rank</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Name</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Current Position</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">CV Scoring</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Skills Match</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Education</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Experience</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Stage</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">LinkedIn</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">CV</th>
                          <th className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...candidatesList]
                          .filter((c: any) => {
                            const searchLower = candidateSearchQuery.toLowerCase()
                            const matchesSearch = !candidateSearchQuery || 
                              c.full_name?.toLowerCase().includes(searchLower) ||
                              c.email?.toLowerCase().includes(searchLower)
                            const matchesStatus = !candidateStatusFilter || c.stage === candidateStatusFilter
                            const matchesSource = !candidateSourceFilter || c.source === candidateSourceFilter
                            return matchesSearch && matchesStatus && matchesSource
                          })
                          .sort((a, b) => (b.cv_scoring || b.ai_ranking || 0) - (a.cv_scoring || a.ai_ranking || 0))
                          .map((candidate: any, index: number) => {
                          const position = recruitmentRequests.find((r: any) => r.id === candidate.recruitment_request_id)
                          const cvScore = candidate.cv_scoring || candidate.ai_ranking
                          return (
                            <tr 
                              key={candidate.id} 
                              className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors group" 
                              onClick={() => { setSelectedCandidate({...candidate, position: position}); setShowCandidateProfileModal(true); }}
                            >
                              <td className="py-5 px-3">
                                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" onClick={(e) => e.stopPropagation()} />
                              </td>
                              <td className="py-5 px-2">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 group-hover:bg-white rounded-lg text-sm font-bold text-gray-600">#{index + 1}</span>
                              </td>
                              <td className="py-5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {candidate.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{candidate.full_name}</p>
                                    <p className="text-xs text-gray-500">{candidate.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 px-4">
                                <p className="text-sm text-gray-700 font-medium">{candidate.current_position || '-'}</p>
                                <p className="text-xs text-gray-400">{candidate.current_company || ''}</p>
                              </td>
                              <td className="py-5 px-4">
                                {cvScore ? (
                                  <div className="flex items-center gap-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                                      cvScore >= 80 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                      cvScore >= 60 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                      cvScore >= 40 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                                      'bg-gradient-to-br from-gray-400 to-gray-500'
                                    }`}>
                                      {cvScore}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-5 px-4">
                                {candidate.skills_match_score ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${
                                          candidate.skills_match_score >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                          candidate.skills_match_score >= 60 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                          'bg-gradient-to-r from-yellow-400 to-orange-500'
                                        }`}
                                        style={{ width: `${candidate.skills_match_score}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">{candidate.skills_match_score}%</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-5 px-4">
                                <span className="text-sm text-gray-700">{candidate.education_level || '-'}</span>
                              </td>
                              <td className="py-5 px-4">
                                <span className="text-sm font-medium text-gray-700">
                                  {candidate.years_experience ? `${candidate.years_experience}+ yrs` : '-'}
                                </span>
                              </td>
                              <td className="py-5 px-4">
                                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg ${
                                  candidate.stage === 'applied' ? 'bg-blue-100 text-blue-700' :
                                  candidate.stage === 'screening' ? 'bg-amber-100 text-amber-700' :
                                  candidate.stage === 'interview' ? 'bg-purple-100 text-purple-700' :
                                  candidate.stage === 'offer' ? 'bg-green-100 text-green-700' :
                                  candidate.stage === 'hired' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {candidate.stage?.charAt(0).toUpperCase() + candidate.stage?.slice(1)}
                                </span>
                              </td>
                              <td className="py-5 px-4">
                                {candidate.linkedin_url ? (
                                  <a 
                                    href={candidate.linkedin_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-lg transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                    View
                                  </a>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-5 px-4">
                                {candidate.resume_url ? (
                                  <a 
                                    href={candidate.resume_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-medium rounded-lg transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    View
                                  </a>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-5 px-4">
                                <span className="text-sm text-gray-600">{candidate.source || '-'}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Table Footer */}
                  <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Click on a candidate row to view their full profile</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button onClick={() => setShowNewRequestModal(true)} className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">New Position</span>
                  </button>
                  <button onClick={() => alert('Add Candidate feature - requires selecting a position first')} className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">Add Candidate</span>
                  </button>
                  <button onClick={() => alert('Upload CV feature - resume parsing coming soon')} className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">Upload CV</span>
                  </button>
                  <button onClick={() => alert('Schedule Interview feature - requires candidates in pipeline')} className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">Schedule Interview</span>
                  </button>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recruitment Module Active</h3>
                    <p className="text-purple-100 mb-3">
                      Backend API is fully implemented with 25+ endpoints. Features include:
                    </p>
                    <ul className="text-sm text-purple-100 space-y-1">
                      <li>• AI-powered CV parsing (pyresparser)</li>
                      <li>• Kanban pipeline with drag-and-drop</li>
                      <li>• Manager & Candidate pass integration</li>
                      <li>• Interview scheduling with availability matching</li>
                      <li>• UAE-specific compliance fields (Emirates ID, Visa)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Tab Content */}
          {adminTab === 'evaluation' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <EoyNominations 
                managerId={user?.employee_id ? parseInt(user.employee_id.replace(/\D/g, '')) || 1 : 1}
                isAdmin={user?.role === 'admin' || user?.role === 'hr'}
                token={user?.token || ''}
              />
            </div>
          )}

          {/* New Recruitment Request Modal */}
          {showNewRequestModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Create New Position</h2>
                  <button onClick={() => setShowNewRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleCreateRecruitmentRequest(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position Title *</label>
                    <input
                      type="text"
                      value={newRequestForm.position_title}
                      onChange={(e) => setNewRequestForm(prev => ({ ...prev, position_title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., Thermodynamics Engineer"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <input
                      type="text"
                      value={newRequestForm.department}
                      onChange={(e) => setNewRequestForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., Engineering / R&D"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                      <select
                        value={newRequestForm.employment_type}
                        onChange={(e) => setNewRequestForm(prev => ({ ...prev, employment_type: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Headcount</label>
                      <input
                        type="number"
                        value={newRequestForm.headcount}
                        onChange={(e) => setNewRequestForm(prev => ({ ...prev, headcount: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range Min (AED)</label>
                      <input
                        type="number"
                        value={newRequestForm.salary_range_min}
                        onChange={(e) => setNewRequestForm(prev => ({ ...prev, salary_range_min: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., 15000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range Max (AED)</label>
                      <input
                        type="number"
                        value={newRequestForm.salary_range_max}
                        onChange={(e) => setNewRequestForm(prev => ({ ...prev, salary_range_max: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., 25000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                    <textarea
                      value={newRequestForm.job_description}
                      onChange={(e) => setNewRequestForm(prev => ({ ...prev, job_description: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[100px]"
                      placeholder="Enter job description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                    <textarea
                      value={newRequestForm.requirements}
                      onChange={(e) => setNewRequestForm(prev => ({ ...prev, requirements: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[100px]"
                      placeholder="Enter requirements..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setShowNewRequestModal(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading || !newRequestForm.position_title} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                      {loading ? 'Creating...' : 'Create Position'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Candidate Profile Modal - Premium Dark Blue Design */}
          {showCandidateProfileModal && selectedCandidate && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2942 50%, #0d1f38 100%)' }}>
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => { setShowCandidateProfileModal(false); setSelectedCandidate(null); }} 
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span className="text-sm font-medium">BACK TO LIST</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <button className="p-2 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Candidate Header Info */}
                  <div className="mt-6 flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white">{selectedCandidate.full_name}</h1>
                      <p className="text-lg text-cyan-400 mt-1">{selectedCandidate.current_position || selectedCandidate.position?.position_title || 'Position not specified'}</p>
                      <div className="flex items-center gap-4 mt-3 text-slate-400 text-sm">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {selectedCandidate.current_location || selectedCandidate.current_country || 'Location pending'}
                        </span>
                        {selectedCandidate.email && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {selectedCandidate.email}
                          </span>
                        )}
                        {selectedCandidate.phone && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {selectedCandidate.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide ${
                        selectedCandidate.stage === 'applied' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        selectedCandidate.stage === 'screening' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        selectedCandidate.stage === 'interview' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        selectedCandidate.stage === 'offer' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        selectedCandidate.stage === 'hired' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {selectedCandidate.stage === 'interview' ? 'Interview Stage' : selectedCandidate.stage?.toUpperCase()}
                      </span>
                      {/* Match Score */}
                      {(selectedCandidate.cv_scoring || selectedCandidate.ai_ranking) && (
                        <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
                          <div className="text-right">
                            <p className="text-3xl font-bold text-cyan-400">{selectedCandidate.cv_scoring || selectedCandidate.ai_ranking}%</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Match Score</p>
                          </div>
                          <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600/50">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Personal Details Card */}
                    <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Personal Details</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Nationality</p>
                          <p className="text-white font-medium">{selectedCandidate.nationality || 'Pending'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Visa Status</p>
                          <p className="text-white font-medium">{selectedCandidate.visa_status || 'Pending'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Willing to Relocate</p>
                          <p className="text-white font-medium">{selectedCandidate.willing_to_relocate === true ? 'Yes' : selectedCandidate.willing_to_relocate === false ? 'No' : 'Pending'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expected Salary</p>
                          <p className="text-cyan-400 font-bold">{selectedCandidate.expected_salary ? `${selectedCandidate.salary_currency || 'AED'} ${Number(selectedCandidate.expected_salary).toLocaleString()}` : 'Pending'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Experience Summary Card */}
                    <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Experience Summary</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-5">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Experience</p>
                          <p className="text-2xl font-bold text-white">{selectedCandidate.years_experience ? `${selectedCandidate.years_experience} Years` : 'Pending'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notice Period</p>
                          <p className="text-2xl font-bold text-white">{selectedCandidate.notice_period_days ? `${selectedCandidate.notice_period_days} Days` : 'Pending'}</p>
                        </div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Current Role</p>
                        <p className="text-lg font-semibold text-white">{selectedCandidate.current_position || 'Not specified'}</p>
                        <p className="text-cyan-400">{selectedCandidate.current_company || ''}</p>
                      </div>
                      {selectedCandidate.industry_function && (
                        <div className="mt-4">
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Industry Background</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg text-sm border border-slate-600/50">{selectedCandidate.industry_function}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Top Skills & Education Row */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Top Skills */}
                      <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Top Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedCandidate.skills?.slice(0, 6).map((skill: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg text-sm border border-cyan-500/20">{skill}</span>
                          )) || (
                            <p className="text-slate-500 text-sm">Skills pending</p>
                          )}
                        </div>
                      </div>

                      {/* Education */}
                      <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                          </svg>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Education</h3>
                        </div>
                        <p className="text-lg font-semibold text-white">{selectedCandidate.education_level || 'Pending'}</p>
                        {selectedCandidate.education_institution && (
                          <>
                            <p className="text-slate-400">{selectedCandidate.education_field || ''}</p>
                            <p className="text-slate-500 text-sm mt-1">{selectedCandidate.education_institution}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Behavioural Fit & Recommendation */}
                  <div className="space-y-6">
                    {/* Behavioural Fit */}
                    {(user?.role === 'admin' || user?.role === 'hr') && (
                      <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Behavioural Fit</h3>
                        </div>
                        
                        {/* Circular Progress */}
                        <div className="flex justify-center mb-6">
                          <div className="relative w-28 h-28">
                            <svg className="w-28 h-28 transform -rotate-90">
                              <circle cx="56" cy="56" r="48" stroke="#1e293b" strokeWidth="8" fill="none" />
                              <circle 
                                cx="56" cy="56" r="48" 
                                stroke="#22d3ee" 
                                strokeWidth="8" 
                                fill="none" 
                                strokeLinecap="round"
                                strokeDasharray={`${(selectedCandidate.skills_match_score || 75) * 3.01} 301`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold text-cyan-400">{selectedCandidate.skills_match_score || 75}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Skill Ratings */}
                        <div className="space-y-3">
                          {['Ownership', 'Accuracy', 'Calm Under Pressure', 'Teamwork', 'Communication'].map((skill, idx) => (
                            <div key={skill} className="flex items-center justify-between">
                              <span className="text-sm text-slate-400">{skill}</span>
                              <div className="flex gap-1">
                                {[1,2,3,4,5].map((dot) => (
                                  <div key={dot} className={`w-2.5 h-2.5 rounded-full ${dot <= (selectedCandidate.soft_skills?.[skill.toLowerCase().replace(/ /g, '_')] || 0) ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        {!selectedCandidate.soft_skills && (
                          <p className="text-xs text-slate-500 mt-3 text-center">Evaluation pending</p>
                        )}

                        {/* Key Strengths */}
                        <div className="mt-5 pt-5 border-t border-slate-700/50">
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Key Strengths</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs border border-cyan-500/20">Collaborative</span>
                            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs border border-cyan-500/20">Detail-oriented</span>
                            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs border border-cyan-500/20">Strategic Thinker</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendation */}
                    {(user?.role === 'admin' || user?.role === 'hr') && (
                      <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/20 rounded-xl p-5 border border-emerald-700/30">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs text-emerald-400 uppercase tracking-wide font-bold">Recommendation</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-400 mb-3">
                          {(selectedCandidate.cv_scoring || selectedCandidate.ai_ranking || 0) >= 70 ? 'Hire' : 
                           (selectedCandidate.cv_scoring || selectedCandidate.ai_ranking || 0) >= 50 ? 'Consider' : 'Review'}
                        </p>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          {(selectedCandidate.cv_scoring || selectedCandidate.ai_ranking || 0) >= 70 
                            ? `${selectedCandidate.full_name?.split(' ')[0]} is a strong candidate with excellent qualifications and cultural fit potential.`
                            : `${selectedCandidate.full_name?.split(' ')[0]} shows potential but may need further evaluation.`
                          }
                        </p>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        {selectedCandidate.resume_path && (
                          <a 
                            href={selectedCandidate.resume_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 w-full px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors border border-blue-500/20"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">View CV</span>
                          </a>
                        )}
                        {selectedCandidate.linkedin_url && (
                          <a 
                            href={selectedCandidate.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 w-full px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600/50"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                            <span className="font-medium">LinkedIn Profile</span>
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setViewingCandidatePassId(selectedCandidate.id)
                            setShowCandidateProfileModal(false)
                            setSelectedCandidate(null)
                            setActiveSection('candidate-pass')
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors border border-cyan-500/20"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          <span className="font-medium">View Candidate Pass</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end">
                  <button
                    onClick={() => { setShowCandidateProfileModal(false); setSelectedCandidate(null); }}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
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

  if (activeSection === 'templates') {
    return <TemplateList />
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
            <button
              onClick={() => setPassFilter('all')}
              className={`bg-white rounded-xl shadow-sm p-5 border-l-4 border-emerald-500 text-left transition-all hover:shadow-md ${passFilter === 'all' ? 'ring-2 ring-emerald-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Passes</p>
                  <p className="text-2xl font-bold text-gray-800">{passes.length}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
            </button>
            <button
              onClick={() => setPassFilter('active')}
              className={`bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500 text-left transition-all hover:shadow-md ${passFilter === 'active' ? 'ring-2 ring-green-500' : ''}`}
            >
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
            </button>
            <button
              onClick={() => setPassFilter('expired')}
              className={`bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500 text-left transition-all hover:shadow-md ${passFilter === 'expired' ? 'ring-2 ring-amber-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Expired</p>
                  <p className="text-2xl font-bold text-amber-600">{passes.filter(p => p.status === 'expired').length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </button>
            <button
              onClick={() => setPassFilter('revoked')}
              className={`bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500 text-left transition-all hover:shadow-md ${passFilter === 'revoked' ? 'ring-2 ring-red-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Revoked</p>
                  <p className="text-2xl font-bold text-red-600">{passes.filter(p => p.status === 'revoked').length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </button>
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
                      className="btn-submit flex-1"
                    >
                      {passesLoading ? 'Creating...' : 'Generate Pass'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassForm(false)}
                      className="btn-cancel flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Filter indicator */}
          {passFilter !== 'all' && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Showing:</span>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                passFilter === 'active' ? 'bg-green-100 text-green-700' :
                passFilter === 'expired' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {passFilter.charAt(0).toUpperCase() + passFilter.slice(1)} passes
              </span>
              <button
                onClick={() => setPassFilter('all')}
                className="text-sm text-emerald-600 hover:text-emerald-800"
              >
                Clear filter
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {passesLoading && passes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Loading passes...</div>
            ) : passes.filter(p => passFilter === 'all' || p.status === passFilter).length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-2">
                  {passFilter === 'all' ? 'No passes generated yet' : `No ${passFilter} passes`}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-emerald-50 border-b border-emerald-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Pass #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Valid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {passes.filter(p => passFilter === 'all' || p.status === passFilter).map(pass => (
                    <tr key={pass.id} className="hover:bg-emerald-50/50">
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
                          pass.status === 'expired' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pass.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => setViewingPass(pass)}
                          className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                        >
                          View
                        </button>
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

          {/* View Pass Modal */}
          {viewingPass && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Pass Details</h2>
                  <button
                    onClick={() => setViewingPass(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-gray-600">Pass Number</span>
                    <span className="font-mono font-bold text-emerald-700">{viewingPass.pass_number}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-800">{viewingPass.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pass Type</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        viewingPass.pass_type === 'recruitment' ? 'bg-blue-100 text-blue-700' :
                        viewingPass.pass_type === 'onboarding' ? 'bg-emerald-100 text-emerald-700' :
                        viewingPass.pass_type === 'visitor' ? 'bg-purple-100 text-purple-700' :
                        viewingPass.pass_type === 'contractor' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {viewingPass.pass_type}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Valid From</p>
                      <p className="font-medium text-gray-800">{viewingPass.valid_from}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valid Until</p>
                      <p className="font-medium text-gray-800">{viewingPass.valid_until}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      viewingPass.status === 'active' ? 'bg-green-100 text-green-700' :
                      viewingPass.status === 'expired' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {viewingPass.status.charAt(0).toUpperCase() + viewingPass.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  {viewingPass.status === 'active' && (
                    <button
                      onClick={() => {
                        revokePass(viewingPass.pass_number)
                        setViewingPass(null)
                      }}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Revoke Pass
                    </button>
                  )}
                  <button
                    onClick={() => setViewingPass(null)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
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

  // Templates Section
  if (activeSection === 'templates' || activeSection === 'template-manager' || activeSection === 'template-candidate' || activeSection === 'template-onboarding' || activeSection === 'template-employee') {
    const templateType = activeSection === 'template-manager' ? 'manager' :
                         activeSection === 'template-candidate' ? 'candidate' :
                         activeSection === 'template-onboarding' ? 'onboarding' :
                         activeSection === 'template-employee' ? 'employee' : null

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        {loginModal}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <img src="/assets/logo.png" alt="Baynunah" className="h-6 mb-1" />
              <h1 className="text-2xl font-semibold text-gray-800">Pass Templates</h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-600">
                  {user.name} ({user.role})
                </span>
              )}
              <button
                onClick={() => templateType ? setActiveSection('templates') : handleNavigate('home')}
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                ← {templateType ? 'Back to Templates' : 'Back to Home'}
              </button>
            </div>
          </div>

          {/* Template Cards Grid */}
          {!templateType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manager Pass Card */}
              <button
                onClick={() => setActiveSection('template-manager')}
                className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-l-4 border-blue-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Manager Pass</h3>
                    <p className="text-sm text-gray-500 mb-3">Recruitment governance, approvals, visibility, next actions</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">Approvals</span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">Pipeline</span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">Actions</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Candidate Pass Card */}
              <button
                onClick={() => setActiveSection('template-candidate')}
                className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-l-4 border-purple-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Candidate Pass</h3>
                    <p className="text-sm text-gray-500 mb-3">Candidate experience, HR visibility, recruitment timeline</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">Stages</span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">Timeline</span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">Contact</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Onboarding Pass Card */}
              <button
                onClick={() => setActiveSection('template-onboarding')}
                className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-l-4 border-emerald-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Onboarding Pass</h3>
                    <p className="text-sm text-gray-500 mb-3">Post-offer acceptance, new joiner checklist, document collection</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">Checklist</span>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">Documents</span>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">Setup</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Employee Pass Card */}
              <button
                onClick={() => setActiveSection('template-employee')}
                className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-l-4 border-amber-500"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Employee Pass</h3>
                    <p className="text-sm text-gray-500 mb-3">Living digital identity for the employee lifecycle</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded-full">Profile</span>
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded-full">Requests</span>
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded-full">Actions</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Manager Pass Template */}
          {templateType === 'manager' && (
            <div className="space-y-6">
              {/* Pass Preview Card */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-blue-100 text-sm">Manager Name</p>
                        <p className="text-xl font-bold">[Manager Name]</p>
                        <p className="text-blue-200 text-sm">ID: [Manager ID]</p>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-1 bg-white/20 rounded text-xs">Department</span>
                    <span className="px-2 py-1 bg-green-500/80 rounded text-xs">Active</span>
                  </div>
                </div>

                {/* Recruitment Overview */}
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Recruitment Overview</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Position</p>
                      <p className="font-medium text-gray-800">[Position Title]</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Status</p>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Open</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">SLA Days</p>
                      <p className="font-medium text-gray-800">[X] days</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Pipeline</p>
                      <p className="font-medium text-gray-800">[X] candidates</p>
                    </div>
                  </div>
                </div>

                {/* Approvals Block */}
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Approvals</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                      <span className="text-sm text-gray-700">Job Requisition</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-700">Budget/Salary</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Approved</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Offer Approval</span>
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Not Started</span>
                    </div>
                  </div>
                </div>

                {/* Pipeline Snapshot */}
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Pipeline Snapshot</h4>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-blue-600 font-bold text-sm">5</span>
                      </div>
                      <p className="text-xs text-gray-500">Screen</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-purple-600 font-bold text-sm">3</span>
                      </div>
                      <p className="text-xs text-gray-500">Assess</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-amber-600 font-bold text-sm">2</span>
                      </div>
                      <p className="text-xs text-gray-500">Interview</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-emerald-600 font-bold text-sm">1</span>
                      </div>
                      <p className="text-xs text-gray-500">Offer</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-gray-600 font-bold text-sm">0</span>
                      </div>
                      <p className="text-xs text-gray-500">Onboard</p>
                    </div>
                  </div>
                </div>

                {/* Next Actions */}
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Next Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors text-left flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve Pending Items
                    </button>
                    <button className="w-full p-3 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors text-left flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Review Candidates
                    </button>
                  </div>
                </div>
              </div>

              {/* Template Info */}
              <div className="bg-blue-50 rounded-xl p-6 max-w-md mx-auto">
                <h4 className="font-semibold text-blue-800 mb-2">Manager Pass Template</h4>
                <p className="text-sm text-blue-700">This template provides recruitment governance, approvals visibility, candidate pipeline tracking, and actionable next steps for hiring managers.</p>
              </div>
            </div>
          )}

          {/* Candidate Pass Template */}
          {templateType === 'candidate' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-purple-100 text-sm">Candidate</p>
                        <p className="text-xl font-bold">[Candidate Name]</p>
                        <p className="text-purple-200 text-sm">ID: [Candidate ID]</p>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-1 bg-white/20 rounded text-xs">[Position Title]</span>
                    <span className="px-2 py-1 bg-amber-500/80 rounded text-xs">Interview Stage</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="p-4 border-b flex gap-2">
                  <button className="flex-1 p-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                    WhatsApp HR
                  </button>
                  <button className="flex-1 p-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Email HR
                  </button>
                  <button className="flex-1 p-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download JD
                  </button>
                </div>

                {/* Stage Panel */}
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Recruitment Stages</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm text-gray-700 flex-1">Application Received</span>
                      <span className="text-xs text-gray-500">Jan 15</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm text-gray-700 flex-1">Screening</span>
                      <span className="text-xs text-gray-500">Jan 18</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm text-gray-700 flex-1">Assessment</span>
                      <span className="text-xs text-gray-500">Jan 22</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-amber-50 rounded-lg">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">4</span>
                      </div>
                      <span className="text-sm text-gray-700 flex-1 font-medium">Interview</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">In Progress</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-60">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">5</span>
                      </div>
                      <span className="text-sm text-gray-500 flex-1">Offer</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-60">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">6</span>
                      </div>
                      <span className="text-sm text-gray-500 flex-1">Onboarding</span>
                    </div>
                  </div>
                </div>

                {/* Next Actions */}
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Next Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full p-3 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors text-left flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Attend Interview
                    </button>
                    <button className="w-full p-3 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors text-left flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Submit Documents
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-6 max-w-md mx-auto">
                <h4 className="font-semibold text-purple-800 mb-2">Candidate Pass Template</h4>
                <p className="text-sm text-purple-700">This template tracks candidate progress through recruitment stages, provides quick HR contact options, and shows clear next steps for the candidate.</p>
              </div>
            </div>
          )}

          {/* Onboarding Pass Template */}
          {templateType === 'onboarding' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-emerald-100 text-sm">New Joiner</p>
                        <p className="text-xl font-bold">[Employee Name]</p>
                        <p className="text-emerald-200 text-sm">Temp ID: [TEMP-XXX]</p>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-1 bg-white/20 rounded text-xs">[Position]</span>
                    <span className="px-2 py-1 bg-blue-500/80 rounded text-xs">New Joiner</span>
                  </div>
                </div>

                {/* Onboarding Checklist */}
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Onboarding Checklist</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm text-gray-700 flex-1">Document Collection</span>
                      <span className="text-xs text-gray-500">By HR</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-amber-50 rounded-lg">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <span className="text-sm text-gray-700 flex-1 font-medium">Visa / Clearance</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-70">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">3</span>
                      </div>
                      <span className="text-sm text-gray-500 flex-1">Medical</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-70">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">4</span>
                      </div>
                      <span className="text-sm text-gray-500 flex-1">IT Setup</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-70">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">5</span>
                      </div>
                      <span className="text-sm text-gray-500 flex-1">Induction Schedule</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-70">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">6</span>
                      </div>
                      <span className="text-sm text-gray-500 flex-1">Insurance Activation</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-70">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">7</span>
                      </div>
                      <span className="text-sm text-gray-500 flex-1">Bank Setup</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-70">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">8</span>
                      </div>
                      <span className="text-sm text-gray-500 flex-1">Attendance Registration</span>
                    </div>
                  </div>
                </div>

                {/* Next Actions */}
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Next Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors text-left flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Upload Document
                    </button>
                    <button className="w-full p-3 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors text-left flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Acknowledge Policies
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-6 max-w-md mx-auto">
                <h4 className="font-semibold text-emerald-800 mb-2">Onboarding Pass Template</h4>
                <p className="text-sm text-emerald-700">This template is used after offer acceptance to track new joiner onboarding progress including documents, visa, IT setup, and induction scheduling.</p>
              </div>
            </div>
          )}

          {/* Employee Pass Template */}
          {templateType === 'employee' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-amber-100 text-sm">Employee</p>
                        <p className="text-xl font-bold">[Employee Name]</p>
                        <p className="text-amber-200 text-sm">ID: [EMP-XXX]</p>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-1 bg-white/20 rounded text-xs">[Position] - [Department]</span>
                    <span className="px-2 py-1 bg-green-500/80 rounded text-xs">Active</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="p-3 bg-green-50 text-green-700 rounded-lg text-xs font-medium flex flex-col items-center gap-1 hover:bg-green-100">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                      WhatsApp
                    </button>
                    <button className="p-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium flex flex-col items-center gap-1 hover:bg-blue-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Email HR
                    </button>
                    <button className="p-3 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium flex flex-col items-center gap-1 hover:bg-amber-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Payslip
                    </button>
                    <button className="p-3 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium flex flex-col items-center gap-1 hover:bg-purple-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Documents
                    </button>
                    <button className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium flex flex-col items-center gap-1 hover:bg-emerald-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Leave
                    </button>
                    <button className="p-3 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium flex flex-col items-center gap-1 hover:bg-gray-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      Bank Details
                    </button>
                  </div>
                </div>

                {/* Profile Snapshot */}
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Profile Snapshot</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Join Date</p>
                      <p className="font-medium text-gray-800">[DD/MM/YYYY]</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Visa Expiry</p>
                      <p className="font-medium text-gray-800">[DD/MM/YYYY]</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Insurance Plan</p>
                      <p className="font-medium text-gray-800">[Plan Name]</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Work Schedule</p>
                      <p className="font-medium text-gray-800">5 days/week</p>
                    </div>
                  </div>
                </div>

                {/* Current Requests */}
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Current Requests</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-sm text-gray-700">Leave Request</span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-sm text-gray-700">Document Request</span>
                      </div>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Completed</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-6 max-w-md mx-auto">
                <h4 className="font-semibold text-amber-800 mb-2">Employee Pass Template</h4>
                <p className="text-sm text-amber-700">This template serves as a living digital identity for employees, providing quick access to HR actions, profile information, and tracking of current requests.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Candidate Pass View
  if (activeSection === 'candidate-pass' && viewingCandidatePassId) {
    return (
      <CandidatePass
        candidateId={viewingCandidatePassId}
        token={user?.token || ''}
        onBack={() => {
          setViewingCandidatePassId(null)
          setActiveSection('admin')
        }}
      />
    )
  }

  // Manager Pass View
  if (activeSection === 'manager-pass' && viewingManagerPassPositionId) {
    return (
      <ManagerPass
        recruitmentRequestId={viewingManagerPassPositionId}
        managerId={viewingManagerId || user?.employee_id || ''}
        token={user?.token || ''}
        onBack={() => {
          setViewingManagerPassPositionId(null)
          setActiveSection('admin')
        }}
      />
    )
  }

  // Insurance Census Management
  if (activeSection === 'insurance-census' && user) {
    return (
      <InsuranceCensus
        token={user.token}
        onBack={() => handleNavigate('admin')}
      />
    )
  }

  // Performance Management Section
  if (activeSection === 'performance' && user) {
    return (
      <div>
        {loginModal}
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => handleNavigate('home')}
            className="px-4 py-2 bg-white/80 backdrop-blur-md text-slate-600 hover:bg-white rounded-xl transition-colors shadow-sm border border-white/60"
          >
            ← Back to Home
          </button>
        </div>
        <Performance user={user} fetchWithAuth={fetchWithAuth} />
      </div>
    )
  }

  // Recruitment Section
  if (activeSection === 'recruitment' || activeSection === 'recruitment-request' || activeSection === 'recruitment-benefits') {
    const recruitmentTab = activeSection === 'recruitment-benefits' ? 'benefits' : 'request'
    
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        {loginModal}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <img src="/assets/logo.png" alt="Baynunah" className="h-6 mb-1" />
              <h1 className="text-2xl font-semibold text-gray-800">Recruitment</h1>
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

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveSection('recruitment-request')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                recruitmentTab === 'request'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Request
              </div>
            </button>
            <button
              onClick={() => setActiveSection('recruitment-benefits')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                recruitmentTab === 'benefits'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Benefits
              </div>
            </button>
          </div>

          {/* Request Tab Content */}
          {recruitmentTab === 'request' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-purple-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Recruitment Requests</h3>
                <p className="text-gray-500 mb-6">Manage job requisitions and hiring requests</p>
                <p className="text-sm text-gray-400">Coming soon - this section will allow you to submit and track recruitment requests</p>
              </div>
            </div>
          )}

          {/* Benefits Tab Content */}
          {recruitmentTab === 'benefits' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-purple-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Benefits Information</h3>
                <p className="text-gray-500 mb-6">View and manage employee benefits packages</p>
                <p className="text-sm text-gray-400">Coming soon - this section will display benefits details for candidates and employees</p>
              </div>
            </div>
          )}
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

  if (activeSection === 'compliance-alerts') {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const renderAlertRow = (alert: ComplianceAlertItem) => (
      <tr key={`${alert.employee_id}-${alert.document_type}`} className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <p className="text-sm font-medium text-gray-900">{alert.employee_name}</p>
          <p className="text-xs text-gray-500">{alert.employee_id}</p>
        </td>
        <td className="px-6 py-4 text-sm text-gray-700">{alert.document_type}</td>
        <td className="px-6 py-4 text-sm text-gray-700">{formatDate(alert.expiry_date)}</td>
        <td className="px-6 py-4">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            alert.days_until_expiry < 0 ? 'bg-red-100 text-red-700' :
            alert.days_until_expiry <= 30 ? 'bg-orange-100 text-orange-700' :
            alert.days_until_expiry <= 60 ? 'bg-yellow-100 text-yellow-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {alert.days_until_expiry < 0 ? `Expired ${Math.abs(alert.days_until_expiry)} days ago` : `${alert.days_until_expiry} days`}
          </span>
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => setViewingProfileId(alert.employee_id)}
            className="text-teal-600 hover:text-teal-800 text-sm font-medium"
          >
            View Profile
          </button>
        </td>
      </tr>
    )

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleNavigate('home')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">Compliance Alerts</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchComplianceAlerts}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Refresh
              </button>
              <span className="text-sm text-gray-600">{user?.name} ({user?.role})</span>
            </div>
          </div>

          {complianceAlertsLoading && !complianceAlerts ? (
            <div className="text-center py-12 text-gray-500">Loading compliance data...</div>
          ) : !user || (user.role !== 'admin' && user.role !== 'hr') ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-4xl mb-4">🔒</p>
              <p className="text-gray-600 mb-6">Please sign in with HR or Admin access to view compliance alerts.</p>
              <button
                onClick={() => handleNavigate('admin')}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-lg">⚠️</div>
                    <div>
                      <p className="text-2xl font-bold text-red-700">{complianceAlerts?.expired.length || 0}</p>
                      <p className="text-xs text-red-600">Expired</p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-lg">🔶</div>
                    <div>
                      <p className="text-2xl font-bold text-orange-700">{complianceAlerts?.days_7?.length || 0}</p>
                      <p className="text-xs text-orange-600">Within 7 days</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 text-lg">🟡</div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-700">{complianceAlerts?.days_30?.length || 0}</p>
                      <p className="text-xs text-yellow-600">Within 30 days</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-lg">📋</div>
                    <div>
                      <p className="text-2xl font-bold text-amber-700">{complianceAlerts?.days_custom?.length || 0}</p>
                      <p className="text-xs text-amber-600">Within 60 days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expired Documents */}
              {complianceAlerts?.expired && complianceAlerts.expired.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg mb-6">
                  <div className="px-6 py-4 border-b border-gray-100 bg-red-50 rounded-t-xl">
                    <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                      <span>⚠️</span> Expired Documents ({complianceAlerts.expired.length})
                    </h2>
                    <p className="text-sm text-red-600 mt-1">These documents have expired and require immediate attention</p>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">Employee</th>
                        <th className="px-6 py-3 text-left">Document</th>
                        <th className="px-6 py-3 text-left">Expiry Date</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complianceAlerts.expired.map(renderAlertRow)}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Expiring in 7 Days */}
              {complianceAlerts?.days_7 && complianceAlerts.days_7.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg mb-6">
                  <div className="px-6 py-4 border-b border-gray-100 bg-orange-50 rounded-t-xl">
                    <h2 className="text-lg font-semibold text-orange-700 flex items-center gap-2">
                      <span>🔶</span> Expiring Within 7 Days ({complianceAlerts.days_7.length})
                    </h2>
                    <p className="text-sm text-orange-600 mt-1">Urgent - documents that need immediate attention</p>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">Employee</th>
                        <th className="px-6 py-3 text-left">Document</th>
                        <th className="px-6 py-3 text-left">Expiry Date</th>
                        <th className="px-6 py-3 text-left">Days Left</th>
                        <th className="px-6 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complianceAlerts.days_7.map(renderAlertRow)}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Expiring in 30 Days */}
              {complianceAlerts?.days_30 && complianceAlerts.days_30.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg mb-6">
                  <div className="px-6 py-4 border-b border-gray-100 bg-yellow-50 rounded-t-xl">
                    <h2 className="text-lg font-semibold text-yellow-700 flex items-center gap-2">
                      <span>🟡</span> Expiring Within 30 Days ({complianceAlerts.days_30.length})
                    </h2>
                    <p className="text-sm text-yellow-600 mt-1">Documents that need to be renewed soon</p>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">Employee</th>
                        <th className="px-6 py-3 text-left">Document</th>
                        <th className="px-6 py-3 text-left">Expiry Date</th>
                        <th className="px-6 py-3 text-left">Days Left</th>
                        <th className="px-6 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complianceAlerts.days_30.map(renderAlertRow)}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Expiring in 60 Days */}
              {complianceAlerts?.days_custom && complianceAlerts.days_custom.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg mb-6">
                  <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 rounded-t-xl">
                    <h2 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
                      <span>📋</span> Expiring Within 60 Days ({complianceAlerts.days_custom.length})
                    </h2>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">Employee</th>
                        <th className="px-6 py-3 text-left">Document</th>
                        <th className="px-6 py-3 text-left">Expiry Date</th>
                        <th className="px-6 py-3 text-left">Days Left</th>
                        <th className="px-6 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complianceAlerts.days_custom.map(renderAlertRow)}
                    </tbody>
                  </table>
                </div>
              )}

              {/* No Alerts */}
              {complianceAlerts && (complianceAlerts.expired.length + (complianceAlerts.days_7?.length || 0) + (complianceAlerts.days_30?.length || 0) + (complianceAlerts.days_custom?.length || 0)) === 0 && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <p className="text-4xl mb-4">✅</p>
                  <p className="text-xl font-semibold text-emerald-600 mb-2">All Clear!</p>
                  <p className="text-gray-600">No documents are expired or expiring within the next 90 days.</p>
                </div>
              )}
            </>
          )}

          {viewingProfileId && (
            <EmployeeProfile
              employeeId={viewingProfileId}
              token={user?.token || ''}
              currentUserRole={user?.role || ''}
              currentUserId={user?.employee_id || ''}
              onClose={() => setViewingProfileId(null)}
            />
          )}
        </div>
      </div>
    )
  }

  if (activeSection === 'attendance') {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleNavigate('home')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">Attendance</h1>
            </div>
            <div className="text-sm text-gray-600">
              {user?.name} ({user?.role})
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
          )}

          {/* Today's Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Today's Status</h2>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {attendanceLoading && !attendanceStatus ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : attendanceStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${attendanceStatus.is_clocked_in ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                  <span className="text-gray-700">{attendanceStatus.message}</span>
                </div>

                {gpsCoords && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>GPS location captured</span>
                  </div>
                )}

                {/* Clock In Form */}
                {attendanceStatus.can_clock_in && (
                  <div className="border-t pt-4 mt-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <button
                        onClick={() => setClockInWorkType('office')}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          clockInWorkType === 'office' 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm">Office</span>
                      </button>
                      <button
                        onClick={() => setClockInWorkType('wfh')}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          clockInWorkType === 'wfh' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-sm">WFH</span>
                      </button>
                      <button
                        onClick={() => setClockInWorkType('field')}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          clockInWorkType === 'field' 
                            ? 'border-amber-500 bg-amber-50 text-amber-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-sm">Field</span>
                      </button>
                    </div>

                    {clockInWorkType === 'wfh' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">WFH Reason</label>
                        <textarea
                          value={wfhReason}
                          onChange={(e) => setWfhReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Please provide a reason for working from home..."
                          rows={2}
                        />
                      </div>
                    )}

                    <button
                      onClick={handleClockIn}
                      disabled={attendanceLoading}
                      className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
                    >
                      {attendanceLoading ? 'Processing...' : 'Clock In'}
                    </button>
                  </div>
                )}

                {/* Break & Clock Out Buttons */}
                {(attendanceStatus.can_clock_out || attendanceStatus.can_start_break || attendanceStatus.can_end_break) && (
                  <div className="flex gap-3 border-t pt-4 mt-4">
                    {attendanceStatus.can_start_break && (
                      <button
                        onClick={handleBreakStart}
                        disabled={attendanceLoading}
                        className="flex-1 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50"
                      >
                        Start Break
                      </button>
                    )}
                    {attendanceStatus.can_end_break && (
                      <button
                        onClick={handleBreakEnd}
                        disabled={attendanceLoading}
                        className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
                      >
                        End Break
                      </button>
                    )}
                    {attendanceStatus.can_clock_out && (
                      <button
                        onClick={handleClockOut}
                        disabled={attendanceLoading}
                        className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                      >
                        Clock Out
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Unable to load attendance status</div>
            )}
          </div>

          {/* Admin Dashboard */}
          {(user?.role === 'admin' || user?.role === 'hr') && attendanceDashboard && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{attendanceDashboard.clocked_in_today}</div>
                  <div className="text-sm text-gray-600">Clocked In</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{attendanceDashboard.wfh_today}</div>
                  <div className="text-sm text-gray-600">WFH</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{attendanceDashboard.late_today}</div>
                  <div className="text-sm text-gray-600">Late</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{attendanceDashboard.absent_today}</div>
                  <div className="text-sm text-gray-600">Absent</div>
                </div>
              </div>
              {(attendanceDashboard.pending_wfh_approvals > 0 || attendanceDashboard.pending_overtime_approvals > 0) && (
                <div className="mt-4 flex gap-4">
                  {attendanceDashboard.pending_wfh_approvals > 0 && (
                    <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      {attendanceDashboard.pending_wfh_approvals} WFH pending
                    </span>
                  )}
                  {attendanceDashboard.pending_overtime_approvals > 0 && (
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {attendanceDashboard.pending_overtime_approvals} OT pending
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent Records */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Recent Attendance</h2>
            </div>
            {attendanceLoading && attendanceRecords.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : attendanceRecords.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No attendance records yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceRecords.slice(0, 10).map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(record.attendance_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          record.work_type === 'office' ? 'bg-emerald-100 text-emerald-700' :
                          record.work_type === 'wfh' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {record.work_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.total_hours ? `${record.total_hours}h` : '-'}
                        {record.overtime_hours && record.overtime_hours > 0 && (
                          <span className="ml-1 text-purple-600">(+{record.overtime_hours}h OT)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                          record.status === 'absent' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {record.status}
                          {record.is_late && record.late_minutes && ` (${record.late_minutes}m)`}
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

      {/* Quick Access Row */}
      <div className="flex flex-wrap gap-4 mt-8 justify-center">
        <button
          onClick={() => handleNavigate('attendance')}
          className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Attendance</span>
        </button>

        <button
          onClick={() => setActiveSection('templates')}
          className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Templates</span>
        </button>

        <button
          onClick={() => setActiveSection('passes')}
          className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Passes</span>
        </button>

        <button
          onClick={() => setActiveSection('recruitment')}
          className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Recruitment</span>
        </button>

        <button
          onClick={() => handleNavigate('performance')}
          className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Appraisals</span>
        </button>

        <button
          onClick={() => handleNavigate('compliance-alerts')}
          className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Compliance Alerts</span>
        </button>

        <button
          onClick={() => handleNavigate('insurance-census')}
          className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Insurance Census</span>
        </button>
      </div>

      <p className="text-gray-400 text-xs mt-12">Conceptualised by Baynunah HR|IS</p>
    </div>
  )
}

export default App
