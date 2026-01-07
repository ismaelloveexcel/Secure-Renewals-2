interface Stage {
  key: string
  label: string
  icon: string
}

interface JourneyTimelineProps {
  stages: Stage[]
  currentStageIndex: number
  entityColor: string
}

export function JourneyTimeline({ stages, currentStageIndex, entityColor }: JourneyTimelineProps) {
  return (
    <div className="mb-4">
      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3">Journey</p>
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 z-0"></div>
        <div 
          className="absolute top-5 left-0 h-0.5 z-10 transition-all duration-500"
          style={{ 
            width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
            backgroundColor: entityColor
          }}
        ></div>
        
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex
            const isCurrent = index === currentStageIndex
            const isPending = index > currentStageIndex
            
            return (
              <div key={stage.key} className="flex flex-col items-center z-20">
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isCompleted || isCurrent
                      ? 'text-white shadow-lg' 
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                  style={isCompleted || isCurrent ? { backgroundColor: entityColor } : {}}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={stage.icon} />
                    </svg>
                  )}
                </div>
                <span className={`text-[8px] mt-1.5 font-semibold text-center ${
                  isCompleted || isCurrent ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {stage.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
