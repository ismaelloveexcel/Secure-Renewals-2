interface ActionRequiredProps {
  action: {
    label: string
    description?: string
    onClick: () => void
    loading?: boolean
  } | null
  entityColor?: string
}

export function ActionRequired({ action, entityColor = '#00B0F0' }: ActionRequiredProps) {
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2.5">Next Action</p>
      
      {action ? (
        <button
          onClick={action.onClick}
          disabled={action.loading}
          className="w-full p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition-all duration-300 shadow-sm flex items-center gap-3 text-left group disabled:opacity-60 relative overflow-hidden"
        >
          {/* Subtle accent border on left edge - now gray */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-slate-200 group-hover:bg-slate-300 transition-colors"
          />
          
          <div 
            className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 bg-slate-50 border border-slate-100"
          >
            <svg 
              className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="#64748b"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex-1 relative z-10">
            <span className="text-sm font-bold text-slate-800 block">{action.label}</span>
            {action.description && (
              <span className="text-[11px] text-slate-500">{action.description}</span>
            )}
          </div>
          {action.loading ? (
            <div 
              className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin"
            ></div>
          ) : (
            <svg 
              className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      ) : (
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center gap-3 relative overflow-hidden">
          {/* Success indicator - kept subtle gray */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-slate-200"
          />
          
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100"
          >
            <svg 
              className="w-5 h-5 text-slate-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-slate-800 block">You're all caught up!</span>
            <span className="text-[11px] text-slate-500">No pending actions at the moment</span>
          </div>
        </div>
      )}
    </div>
  )
}
