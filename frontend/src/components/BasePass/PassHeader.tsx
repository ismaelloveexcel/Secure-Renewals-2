import { ReactNode } from 'react'

interface PassHeaderProps {
  title: string
  subtitle?: string
  referenceId?: string
  entityColor: string
  entityName?: string
  statusBadge?: ReactNode
  avatar?: ReactNode
  actions?: ReactNode
}

export function PassHeader({
  title,
  subtitle,
  referenceId,
  entityColor,
  entityName,
  statusBadge,
  avatar,
  actions
}: PassHeaderProps) {
  return (
    <div className="px-5 pt-5 pb-3 flex-shrink-0 bg-gradient-to-b from-white to-transparent">
      <div className="flex items-center justify-between mb-1">
        <div 
          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${entityColor}15`, color: entityColor }}
        >
          {entityName || 'Pass'}
        </div>
        {actions}
      </div>
      
      <div className="flex items-start gap-3 mt-2">
        {avatar && (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-bold flex-shrink-0"
            style={{ backgroundColor: entityColor }}
          >
            {avatar}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-slate-900 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>}
          {referenceId && (
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{referenceId}</p>
          )}
        </div>
        
        {statusBadge}
      </div>
    </div>
  )
}
