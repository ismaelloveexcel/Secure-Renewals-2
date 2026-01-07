import { useState } from 'react'

export interface ActivityItem {
  id: number
  action_type: string
  action_description: string
  performed_by: string
  timestamp: string
  stage: string
}

interface ActivityHistoryProps {
  activities: ActivityItem[]
  loading?: boolean
  collapsed?: boolean
}

export function ActivityHistory({ activities, loading, collapsed = true }: ActivityHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      'profile_completed': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'document_uploaded': 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'stage_changed': 'M13 7l5 5m0 0l-5 5m5-5H6',
      'interview_scheduled': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      'slot_booked': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'default': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
    return icons[actionType] || icons.default
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-slate-100 rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-slate-400">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2"
      >
        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Activity History</p>
        <svg 
          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="space-y-2 mt-2">
          {activities.slice(0, 5).map(activity => (
            <div 
              key={activity.id} 
              className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg"
            >
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={getActionIcon(activity.action_type)} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-700 font-medium leading-tight">
                  {activity.action_description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-slate-400">{activity.performed_by}</span>
                  <span className="text-[9px] text-slate-300">•</span>
                  <span className="text-[9px] text-slate-400">{formatTime(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
          {activities.length > 5 && (
            <button className="w-full text-center text-[10px] text-emerald-600 font-medium py-2 hover:underline">
              View all {activities.length} activities
            </button>
          )}
        </div>
      )}
    </div>
  )
}
