import { getEntityPatternSvg } from './entityTheme'

interface PassFooterProps {
  entityName?: string
  entityColor: string
  context?: string
  showBranding?: boolean
}

/**
 * Standardized Pass Footer Component
 * 
 * Provides consistent branding footer across all passes with:
 * - Entity-themed background
 * - Subtle pattern overlays
 * - Company branding
 */
export function PassFooter({
  entityName = 'Baynunah Group',
  entityColor,
  context = 'Recruitment',
  showBranding = true
}: PassFooterProps) {
  // Use centralized pattern generation
  const patternSvg = getEntityPatternSvg(entityName)

  return (
    <div 
      className="px-4 py-3 text-center flex-shrink-0 border-t border-slate-100/50 relative overflow-hidden"
      style={{ backgroundColor: `${entityColor}06` }}
    >
      {/* Subtle pattern for entity theme - using centralized utility */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: patternSvg,
          backgroundSize: '30px 30px'
        }}
      />
      
      {showBranding && (
        <span className="text-[10px] text-slate-500 font-medium relative z-10">
          {context}: <span style={{ color: entityColor }} className="font-semibold">{entityName}</span>
        </span>
      )}
    </div>
  )
}
