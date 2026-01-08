import { ReactNode } from 'react'

export interface PassTab {
  id: string
  label: string
  icon: string
}

export interface BasePassContainerProps {
  entityColor: string
  entityName?: string
  passType: 'candidate' | 'manager'
  header: ReactNode
  journey?: ReactNode
  actionRequired?: ReactNode
  children: ReactNode
  tabs: PassTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function BasePassContainer({
  entityColor,
  entityName,
  passType,
  header,
  journey,
  actionRequired,
  children,
  tabs,
  activeTab,
  onTabChange
}: BasePassContainerProps) {
  const isAgriculture = entityName?.includes('Agriculture')
  
  return (
    <div className="h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-md" style={{ height: 'calc(100vh - 32px)', maxHeight: '700px' }}>
        {/* Premium 3D Card Container */}
        <div 
          className="bg-gradient-to-br from-white via-white to-slate-50 border border-white/80 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-500 hover:-translate-y-0.5"
          style={{ 
            boxShadow: `0 25px 60px -15px rgba(0,0,0,0.15), 0 10px 30px -10px ${entityColor}20, 0 -2px 6px rgba(255,255,255,0.8) inset`
          }}
        >
          {header}
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {journey}
            {actionRequired}
            {children}
          </div>

          {/* Premium Bottom Navigation */}
          <div className="relative border-t border-slate-100 px-2 py-2 sm:py-2.5 flex-shrink-0 bg-white/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            {/* Active tab indicator line */}
            <div 
              className="absolute top-0 h-0.5 rounded-full transition-all duration-300 ease-out"
              style={{ 
                backgroundColor: entityColor,
                width: `${100 / tabs.length - 8}%`,
                left: `calc(${tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length)}% + 4%)`,
                boxShadow: `0 0 8px ${entityColor}60`
              }}
            />
            <div className="flex">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex-1 py-1.5 flex flex-col items-center gap-1 relative transition-all duration-300 ${
                      isActive ? '' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    style={isActive ? { color: entityColor } : undefined}
                  >
                    <div 
                      className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-105'}`}
                      style={isActive ? { 
                        backgroundColor: `${entityColor}12`,
                        boxShadow: `0 4px 12px ${entityColor}20`
                      } : undefined}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                      </svg>
                    </div>
                    <span className={`text-[8px] sm:text-[9px] transition-all ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Premium Entity Footer */}
          {entityName && (
            <div 
              className="px-4 py-2.5 text-center flex-shrink-0 border-t border-slate-100/50 relative overflow-hidden"
              style={{ backgroundColor: `${entityColor}06` }}
            >
              {/* Subtle pattern for entity theme */}
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: entityName.includes('Agriculture')
                    ? 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-8.284 0-15-6.716-15-15C15 6.716 21.716 0 30 0zm0 45c8.284 0 15 6.716 15 15H15c0-8.284 6.716-15 15-15z\' fill=\'%2300bf63\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
                    : 'url("data:image/svg+xml,%3Csvg width=\'52\' height=\'26\' viewBox=\'0 0 52 26\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z\' fill=\'%2300B0F0\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
                }}
              />
              <span className="text-[10px] text-slate-500 font-medium relative z-10">
                Recruitment: <span style={{ color: entityColor }} className="font-semibold">{entityName}</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Add shimmer keyframes via style tag */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
