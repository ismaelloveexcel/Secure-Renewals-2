interface ActionRequiredProps {
  action: {
    label: string
    description?: string
    onClick: () => void
    loading?: boolean
  } | null
  entityColor?: string
}

export function ActionRequired({ action, entityColor = '#00bf63' }: ActionRequiredProps) {
  if (!action) return null

  return (
    <div className="mb-4">
      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Next Action</p>
      <button
        onClick={action.onClick}
        disabled={action.loading}
        className="w-full p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm flex items-center gap-3 text-left group disabled:opacity-60"
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: `${entityColor}15` }}
        >
          <svg 
            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke={entityColor}
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-slate-800 block">{action.label}</span>
          {action.description && (
            <span className="text-[10px] text-slate-400">{action.description}</span>
          )}
        </div>
        {action.loading && (
          <div className="animate-spin w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full"></div>
        )}
      </button>
    </div>
  )
}
