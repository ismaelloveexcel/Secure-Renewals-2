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
    <div className="mb-2">
      <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-2">Journey</p>
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 z-0"></div>
        <div 
          className="absolute top-4 left-0 h-0.5 z-10 transition-all duration-500"
          style={{ 
            width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
            backgroundColor: entityColor
          }}
        ></div>
        
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex
            const isCurrent = index === currentStageIndex
            
            return (
              <div key={stage.key} className="flex flex-col items-center z-20">
                <div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isCompleted || isCurrent
                      ? 'text-white shadow-md' 
                      : 'bg-white border border-slate-200 text-slate-400'
                  }`}
                  style={isCompleted || isCurrent ? { backgroundColor: entityColor } : {}}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={stage.icon} />
                    </svg>
                  )}
                </div>
                <span className={`text-[7px] mt-1 font-semibold text-center ${
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
