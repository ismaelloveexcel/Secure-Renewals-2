/**
 * Manager Pass Dashboard
 * 
 * Shows all recruitment requests for a manager when they have multiple positions.
 * Each recruitment request = 1 position = 1 pass.
 * 
 * Manager can:
 * - View all their recruitment passes at a glance
 * - Switch between passes
 * - See key metrics for each position
 */

import React, { useState, useEffect } from 'react'
import { getEntityColor } from '../BasePass'

interface RecruitmentPassSummary {
  id: number
  pass_id: string
  position_title: string
  department: string
  status: string
  total_candidates: number
  candidates_shortlisted: number
  candidates_interviewed: number
  days_since_request: number
  priority: string
  created_at: string
  entity?: string
}

interface ManagerPassDashboardProps {
  managerId: string
  token: string
  onSelectPass: (requestId: number) => void
}

export function ManagerPassDashboard({ managerId, token, onSelectPass }: ManagerPassDashboardProps) {
  const [passes, setPasses] = useState<RecruitmentPassSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const API_URL = '/api'

  useEffect(() => {
    fetchManagerPasses()
  }, [managerId])

  const fetchManagerPasses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/recruitment/manager/${managerId}/passes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load passes')
      const data = await response.json()
      setPasses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passes')
    } finally {
      setLoading(false)
    }
  }

  const filteredPasses = filterStatus === 'all' 
    ? passes 
    : passes.filter(p => p.status === filterStatus)

  const statusOptions = ['all', 'active', 'screening', 'interviewing', 'filled', 'on_hold']

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
      case 'high': return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' }
      case 'normal': return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }
      case 'low': return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
      default: return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return { bg: 'bg-emerald-100', text: 'text-emerald-700' }
      case 'screening': return { bg: 'bg-blue-100', text: 'text-blue-700' }
      case 'interviewing': return { bg: 'bg-purple-100', text: 'text-purple-700' }
      case 'filled': return { bg: 'bg-green-100', text: 'text-green-700' }
      case 'on_hold': return { bg: 'bg-amber-100', text: 'text-amber-700' }
      default: return { bg: 'bg-slate-100', text: 'text-slate-600' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading your recruitment passes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-medium text-slate-800 mb-1">Error Loading Passes</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <button 
            onClick={fetchManagerPasses}
            className="mt-4 px-4 py-2 text-sm text-white bg-[#1800ad] hover:bg-[#1400a0] rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (passes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">No Recruitment Passes</h2>
          <p className="text-sm text-slate-500">You don't have any active recruitment requests yet.</p>
        </div>
      </div>
    )
  }

  // If only one pass, go directly to it
  if (passes.length === 1) {
    onSelectPass(passes[0].id)
    return null
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">My Recruitment Passes</h1>
        <p className="text-sm text-slate-500">{passes.length} active position{passes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {statusOptions.map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filterStatus === status 
                ? 'bg-[#1800ad] text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <p className="text-2xl font-bold text-slate-800">{passes.length}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Positions</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <p className="text-2xl font-bold text-[#1800ad]">{passes.reduce((sum, p) => sum + p.total_candidates, 0)}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Candidates</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <p className="text-2xl font-bold text-emerald-600">{passes.reduce((sum, p) => sum + p.candidates_interviewed, 0)}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Interviewed</p>
        </div>
      </div>

      {/* Pass Cards */}
      <div className="space-y-3">
        {filteredPasses.map(pass => {
          const entityColor = getEntityColor(pass.entity || '')
          const priorityColors = getPriorityColor(pass.priority)
          const statusColors = getStatusBadge(pass.status)
          
          return (
            <div 
              key={pass.id}
              onClick={() => onSelectPass(pass.id)}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-all group"
            >
              {/* Colored top bar */}
              <div className="h-2" style={{ backgroundColor: entityColor }} />
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Priority indicator */}
                      <div className={`w-2 h-2 rounded-full ${priorityColors.dot}`} />
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${priorityColors.bg} ${priorityColors.text} font-semibold uppercase`}>
                        {pass.priority}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-[#1800ad] transition-colors truncate">
                      {pass.position_title}
                    </h3>
                    <p className="text-xs text-slate-500">{pass.department}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">{pass.pass_id}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] px-2 py-1 rounded-full font-semibold ${statusColors.bg} ${statusColors.text}`}>
                      {pass.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {pass.days_since_request} days
                    </span>
                  </div>
                </div>
                
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{pass.total_candidates}</p>
                    <p className="text-[9px] text-slate-400">Applied</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: entityColor }}>{pass.candidates_shortlisted}</p>
                    <p className="text-[9px] text-slate-400">Shortlisted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{pass.candidates_interviewed}</p>
                    <p className="text-[9px] text-slate-400">Interviewed</p>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="flex justify-end mt-2">
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-[#1800ad] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredPasses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No passes match this filter</p>
        </div>
      )}
    </div>
  )
}
