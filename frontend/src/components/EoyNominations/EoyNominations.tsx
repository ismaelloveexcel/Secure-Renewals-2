import React, { useState, useEffect } from 'react'

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

interface NominationResponse {
  id: number
  nominee_id: number
  nominee_name: string
  nominee_job_title: string | null
  nominee_department: string | null
  nominator_id: number
  nominator_name: string
  nomination_year: number
  justification: string
  achievements: string | null
  impact_description: string | null
  status: string
  reviewed_by: number | null
  reviewer_name: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
}

interface NominationStats {
  total_nominations: number
  pending_count: number
  shortlisted_count: number
  winner_count: number
  not_selected_count: number
}

interface Props {
  managerId: number
  isAdmin: boolean
  token: string
}

export function EoyNominations({ managerId, isAdmin, token }: Props) {
  const [activeView, setActiveView] = useState<'nominate' | 'my-nominations' | 'all'>('nominate')
  const [eligibleEmployees, setEligibleEmployees] = useState<EligibleEmployee[]>([])
  const [myNominations, setMyNominations] = useState<NominationResponse[]>([])
  const [allNominations, setAllNominations] = useState<NominationResponse[]>([])
  const [stats, setStats] = useState<NominationStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [selectedEmployee, setSelectedEmployee] = useState<EligibleEmployee | null>(null)
  const [formData, setFormData] = useState({
    justification: '',
    achievements: '',
    impact_description: ''
  })

  const API_BASE = '/api'
  const currentYear = new Date().getFullYear()

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string> || {}),
    }
    return fetch(url, { ...options, headers })
  }

  const fetchEligibleEmployees = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE}/nominations/eligible-employees/${managerId}?year=${currentYear}`)
      if (res.ok) {
        const data = await res.json()
        setEligibleEmployees(data)
      }
    } catch (err) {
      console.error('Failed to fetch eligible employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyNominations = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE}/nominations/my-nominations/${managerId}?year=${currentYear}`)
      if (res.ok) {
        const data = await res.json()
        setMyNominations(data)
      }
    } catch (err) {
      console.error('Failed to fetch my nominations:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllNominations = async () => {
    if (!isAdmin) return
    setLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE}/nominations/all?year=${currentYear}`)
      if (res.ok) {
        const data = await res.json()
        setAllNominations(data.nominations)
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to fetch all nominations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeView === 'nominate') {
      fetchEligibleEmployees()
    } else if (activeView === 'my-nominations') {
      fetchMyNominations()
    } else if (activeView === 'all' && isAdmin) {
      fetchAllNominations()
    }
  }, [activeView, managerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return
    
    if (formData.justification.length < 50) {
      setError('Please provide a more detailed justification (at least 50 characters)')
      return
    }
    
    setSubmitting(true)
    setError(null)
    
    try {
      const res = await fetchWithAuth(`${API_BASE}/nominations/submit?nominator_id=${managerId}`, {
        method: 'POST',
        body: JSON.stringify({
          nominee_id: selectedEmployee.id,
          justification: formData.justification,
          achievements: formData.achievements || null,
          impact_description: formData.impact_description || null
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to submit nomination')
      }
      
      setSuccess(`Successfully nominated ${selectedEmployee.name} for Employee of the Year!`)
      setSelectedEmployee(null)
      setFormData({ justification: '', achievements: '', impact_description: '' })
      fetchEligibleEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit nomination')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (nominationId: number, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/nominations/${nominationId}/review?reviewer_id=${managerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, review_notes: null })
      })
      
      if (res.ok) {
        fetchAllNominations()
      }
    } catch (err) {
      console.error('Failed to update nomination:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      shortlisted: 'bg-blue-100 text-blue-700',
      winner: 'bg-emerald-100 text-emerald-700',
      not_selected: 'bg-gray-100 text-gray-600'
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Employee of the Year {currentYear}</h2>
          <p className="text-sm text-gray-500 mt-1">Nominate outstanding team members for recognition</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('nominate')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'nominate' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Nominate
          </button>
          <button
            onClick={() => setActiveView('my-nominations')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'my-nominations' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            My Nominations
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveView('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'all' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Nominations
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-sm">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-2 text-emerald-500 hover:text-emerald-700">×</button>
        </div>
      )}

      {activeView === 'nominate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Eligible Team Members</h3>
            <p className="text-sm text-gray-500 mb-4">Select an employee from your direct reports to nominate</p>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : eligibleEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>No eligible employees found</p>
                <p className="text-xs mt-1">Only Officers and below can be nominated</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {eligibleEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => !emp.already_nominated && setSelectedEmployee(emp)}
                    disabled={emp.already_nominated}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      emp.already_nominated 
                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                        : selectedEmployee?.id === emp.id
                          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                          : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold">
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{emp.name}</p>
                        <p className="text-sm text-gray-500 truncate">{emp.job_title || 'No title'}</p>
                      </div>
                      {emp.already_nominated && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          Nominated
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Nomination Details</h3>
            
            {selectedEmployee ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-700">Nominating</p>
                  <p className="font-semibold text-emerald-800">{selectedEmployee.name}</p>
                  <p className="text-sm text-emerald-600">{selectedEmployee.job_title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.justification}
                    onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                    placeholder="Why does this employee deserve the Employee of the Year award? (min. 50 characters)"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    required
                    minLength={50}
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.justification.length}/50 minimum characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
                  <textarea
                    value={formData.achievements}
                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                    placeholder="List specific achievements and contributions..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impact Description</label>
                  <textarea
                    value={formData.impact_description}
                    onChange={(e) => setFormData({ ...formData, impact_description: e.target.value })}
                    placeholder="Describe the impact on team/organization..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEmployee(null)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || formData.justification.length < 50}
                    className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Nomination'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p className="font-medium">Select an employee to nominate</p>
                <p className="text-sm mt-1">Choose from your direct reports on the left</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'my-nominations' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">My Nominations for {currentYear}</h3>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : myNominations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="font-medium">No nominations yet</p>
              <p className="text-sm mt-1">Start by nominating a team member</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myNominations.map(nom => (
                <div key={nom.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{nom.nominee_name}</p>
                      <p className="text-sm text-gray-500">{nom.nominee_job_title} • {nom.nominee_department}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(nom.status)}`}>
                      {nom.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{nom.justification}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted {new Date(nom.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'all' && isAdmin && (
        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.total_nominations}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="bg-amber-50 rounded-xl shadow p-4 text-center border border-amber-200">
                <p className="text-2xl font-bold text-amber-700">{stats.pending_count}</p>
                <p className="text-sm text-amber-600">Pending</p>
              </div>
              <div className="bg-blue-50 rounded-xl shadow p-4 text-center border border-blue-200">
                <p className="text-2xl font-bold text-blue-700">{stats.shortlisted_count}</p>
                <p className="text-sm text-blue-600">Shortlisted</p>
              </div>
              <div className="bg-emerald-50 rounded-xl shadow p-4 text-center border border-emerald-200">
                <p className="text-2xl font-bold text-emerald-700">{stats.winner_count}</p>
                <p className="text-sm text-emerald-600">Winners</p>
              </div>
              <div className="bg-gray-50 rounded-xl shadow p-4 text-center border border-gray-200">
                <p className="text-2xl font-bold text-gray-600">{stats.not_selected_count}</p>
                <p className="text-sm text-gray-500">Not Selected</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">All Nominations</h3>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : allNominations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="font-medium">No nominations received yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allNominations.map(nom => (
                  <div key={nom.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{nom.nominee_name}</p>
                        <p className="text-sm text-gray-500">{nom.nominee_job_title} • {nom.nominee_department}</p>
                        <p className="text-xs text-gray-400 mt-1">Nominated by {nom.nominator_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(nom.status)}`}>
                          {nom.status.replace('_', ' ')}
                        </span>
                        <select
                          value={nom.status}
                          onChange={(e) => handleUpdateStatus(nom.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="winner">Winner</option>
                          <option value="not_selected">Not Selected</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <p className="font-medium text-gray-700">Justification:</p>
                      <p className="mt-1">{nom.justification}</p>
                    </div>
                    {nom.achievements && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium text-gray-700">Achievements:</p>
                        <p className="mt-1">{nom.achievements}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
