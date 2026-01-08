import { ReactNode } from 'react'
import { getEntityHeaderColor, getEntityPatternSvg } from './entityTheme'

interface PassHeaderProps {
  title: string
  subtitle?: string
  referenceId?: string
  entityColor: string
  entityName?: string
  passType?: 'candidate' | 'manager' | 'employee' | 'nomination'
  statusBadge?: ReactNode
  avatar?: ReactNode
  actions?: ReactNode
  department?: string
  secondaryInfo?: string
}

/**
 * Standardized Pass Header Component
 * 
 * Provides a consistent header design across all pass types with:
 * - Entity-aware color theming
 * - Responsive typography
 * - Consistent badge and action placements
 */
export function PassHeader({
  title,
  subtitle,
  referenceId,
  entityColor,
  entityName,
  passType = 'candidate',
  statusBadge,
  avatar,
  actions,
  department,
  secondaryInfo
}: PassHeaderProps) {
  // Get pass type label for consistent naming
  const passTypeLabels: Record<string, string> = {
    candidate: 'Candidate Pass',
    manager: 'Hiring Manager Pass',
    employee: 'Employee Pass',
    nomination: 'Nomination Pass'
  }

  const passLabel = passTypeLabels[passType] || 'Pass'

  // Use centralized entity theming
  const headerBgColor = getEntityHeaderColor(entityName)
  const patternSvg = getEntityPatternSvg(entityName)

  return (
    <div 
      className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex-shrink-0 relative overflow-hidden"
      style={{ backgroundColor: headerBgColor }}
    >
      {/* Subtle pattern overlay - uses entity-specific pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: patternSvg,
          backgroundSize: '30px 30px'
        }}
      />

      <div className="relative z-10">
        {/* Top row: Pass type badge and actions */}
        <div className="flex items-center justify-between mb-2">
          <div 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white backdrop-blur-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
            {passLabel}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
        
        {/* Main content row */}
        <div className="flex items-start gap-3">
          {/* Avatar/Initial */}
          {avatar && (
            <div 
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 shadow-lg"
              style={{ 
                backgroundColor: 'white',
                color: headerBgColor
              }}
            >
              {avatar}
            </div>
          )}
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-white/80 font-medium truncate mt-0.5">
                {subtitle}
              </p>
            )}
            {department && (
              <p className="text-[11px] text-white/70 truncate">
                {department}
              </p>
            )}
            {referenceId && (
              <div 
                className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm"
              >
                <span className="text-[10px] text-white/90 font-mono tracking-wide">
                  {referenceId}
                </span>
              </div>
            )}
          </div>
          
          {/* Status badge on the right */}
          {statusBadge && (
            <div className="flex-shrink-0">
              {statusBadge}
            </div>
          )}
        </div>

        {/* Optional secondary info row */}
        {secondaryInfo && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-[10px] text-white/70">{secondaryInfo}</p>
          </div>
        )}
      </div>
    </div>
  )
}
