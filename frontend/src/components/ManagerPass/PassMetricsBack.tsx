interface RecruitmentMetrics {
  daysSinceRequest: number
  applicationsReceived: number
  applicationSources: {
    agency: number
    direct: number
    referral: number
  }
  candidatesShortlisted: number
  candidatesInterviewed: number
}

interface PassMetricsBackProps {
  metrics: RecruitmentMetrics
  positionTitle: string
  requestNumber?: string
  onFlip: () => void
}

/**
 * Manager Pass Back Panel - Recruitment Metrics
 * 
 * Shows key recruitment metrics when the pass is flipped:
 * - Days Since Request Raised
 * - Applications Received
 * - Application Sources (Agency/Direct/Referral)
 * - Candidates Shortlisted
 * - Candidates Interviewed
 */
export function PassMetricsBack({ 
  metrics, 
  positionTitle, 
  requestNumber,
  onFlip 
}: PassMetricsBackProps) {
  const totalSources = metrics.applicationSources.agency + 
                       metrics.applicationSources.direct + 
                       metrics.applicationSources.referral

  const getSourcePercentage = (count: number) => {
    if (totalSources === 0) return 0
    return Math.round((count / totalSources) * 100)
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#1800ad] to-[#0d0066] text-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">Recruitment Metrics</p>
            <p className="text-xs font-semibold text-white/90 mt-0.5">{positionTitle}</p>
            {requestNumber && (
              <p className="text-[10px] font-mono text-white/50 mt-0.5">{requestNumber}</p>
            )}
          </div>
          <button 
            onClick={onFlip}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Flip to front"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-3">
          
          {/* Days Since Request - Large Counter */}
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">Days Since Request</p>
                <p className="text-[10px] text-white/40 mt-0.5">Request raised</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-white">{metrics.daysSinceRequest}</p>
                <p className="text-[9px] text-white/50">days</p>
              </div>
            </div>
          </div>

          {/* Applications Received */}
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">Applications Received</p>
                <p className="text-2xl font-bold text-white">{metrics.applicationsReceived}</p>
              </div>
            </div>
          </div>

          {/* Application Sources */}
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold mb-3">Application Sources</p>
            
            {/* Progress bars */}
            <div className="space-y-3">
              {/* Agency */}
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-white/80 font-medium">Agency</span>
                  <span className="text-white font-bold">{metrics.applicationSources.agency}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${getSourcePercentage(metrics.applicationSources.agency)}%` }}
                  />
                </div>
              </div>
              
              {/* Direct */}
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-white/80 font-medium">Direct</span>
                  <span className="text-white font-bold">{metrics.applicationSources.direct}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${getSourcePercentage(metrics.applicationSources.direct)}%` }}
                  />
                </div>
              </div>
              
              {/* Referral */}
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-white/80 font-medium">Referral</span>
                  <span className="text-white font-bold">{metrics.applicationSources.referral}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-400 rounded-full transition-all duration-500"
                    style={{ width: `${getSourcePercentage(metrics.applicationSources.referral)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shortlisted & Interviewed - Side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-black text-white">{metrics.candidatesShortlisted}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/50 font-semibold mt-1">Shortlisted</p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 text-center">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-3xl font-black text-white">{metrics.candidatesInterviewed}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/50 font-semibold mt-1">Interviewed</p>
            </div>
          </div>

        </div>
      </div>

      {/* Footer - Tap to flip hint */}
      <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
        <button 
          onClick={onFlip}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-[10px] text-white/60 font-medium">Tap to flip back</span>
        </button>
      </div>
    </div>
  )
}

export type { RecruitmentMetrics }
