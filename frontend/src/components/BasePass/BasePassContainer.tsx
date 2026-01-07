import { ReactNode } from 'react'

export interface PassTab {
  id: string
  label: string
  icon: string
}

export interface BasePassContainerProps {
  entityColor: string
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
  header,
  journey,
  actionRequired,
  children,
  tabs,
  activeTab,
  onTabChange
}: BasePassContainerProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div 
          className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden flex flex-col" 
          style={{ height: '95vh', maxHeight: '900px' }}
        >
          {header}
          
          <div className="flex-1 overflow-y-auto px-5 pb-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {journey}
            {actionRequired}
            {children}
          </div>

          <div className="border-t border-slate-100 px-2 py-2 flex-shrink-0 bg-white/80 backdrop-blur-sm">
            <div className="flex">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex-1 py-2.5 flex flex-col items-center gap-1 relative transition-all duration-200 ${
                    activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeTab === tab.id ? 'bg-emerald-50' : ''}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === tab.id ? 2 : 1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                    </svg>
                  </div>
                  <span className={`text-[9px] font-medium ${activeTab === tab.id ? 'font-bold' : ''}`}>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/3 right-1/3 h-0.5 bg-emerald-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
