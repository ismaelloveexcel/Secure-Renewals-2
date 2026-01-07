export interface ActionConfig {
  label: string
  description?: string
  actionType: string
}

export const CANDIDATE_STAGES = [
  { key: 'application', label: 'Application', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'screening', label: 'Assessment', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'interview', label: 'Interview', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'offer', label: 'Offer', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { key: 'onboarding', label: 'Onboarding', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
]

export const MANAGER_STAGES = [
  { key: 'setup', label: 'Setup', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { key: 'sourcing', label: 'Sourcing', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { key: 'interviewing', label: 'Interviewing', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'selection', label: 'Selection', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'closed', label: 'Closed', icon: 'M5 13l4 4L19 7' }
]

export function getCandidateActionRequired(
  stage: string, 
  status: string
): ActionConfig | null {
  const actionMap: Record<string, Record<string, ActionConfig>> = {
    application: {
      profile_incomplete: { label: 'Complete Profile', description: 'Fill in your details', actionType: 'complete_profile' },
      documents_pending: { label: 'Upload Documents', description: 'Submit required documents', actionType: 'upload_documents' },
      confirmation_pending: { label: 'Confirm Details', description: 'Review and confirm your information', actionType: 'confirm_details' }
    },
    screening: {
      assessment_pending: { label: 'Complete Assessment', description: 'Take the online assessment', actionType: 'complete_assessment' },
      awaiting_review: { label: 'Awaiting Review', description: 'Your application is being reviewed', actionType: 'none' }
    },
    interview: {
      slot_selection_pending: { label: 'Select Interview Slot', description: 'Choose your preferred time', actionType: 'select_slot' },
      confirmation_pending: { label: 'Confirm Interview', description: 'Confirm your attendance', actionType: 'confirm_interview' },
      scheduled: { label: 'View Interview Details', description: 'Check interview information', actionType: 'view_interview' }
    },
    offer: {
      review_pending: { label: 'Review Offer', description: 'Review your offer letter', actionType: 'review_offer' },
      signature_pending: { label: 'Sign Offer Letter', description: 'Accept and sign the offer', actionType: 'sign_offer' }
    },
    onboarding: {
      documents_pending: { label: 'Upload Documents', description: 'Submit onboarding documents', actionType: 'upload_onboarding_docs' },
      form_pending: { label: 'Complete Forms', description: 'Fill required onboarding forms', actionType: 'complete_forms' }
    }
  }

  const stageLower = stage.toLowerCase()
  const statusLower = status.toLowerCase()
  
  return actionMap[stageLower]?.[statusLower] || null
}

export function getManagerActionRequired(
  positionStatus: string,
  hasInterviewSetup: boolean,
  hasAvailableSlots: boolean,
  pendingEvaluations: number
): ActionConfig | null {
  if (!hasInterviewSetup) {
    return { label: 'Configure Interview', description: 'Set up interview format and rounds', actionType: 'setup_interview' }
  }
  
  if (!hasAvailableSlots) {
    return { label: 'Add Time Slots', description: 'Provide available interview times', actionType: 'add_slots' }
  }
  
  if (pendingEvaluations > 0) {
    return { label: `Review ${pendingEvaluations} Candidate${pendingEvaluations > 1 ? 's' : ''}`, description: 'Submit interview feedback', actionType: 'review_candidates' }
  }
  
  return null
}

export function getStageIndex(stages: { key: string }[], currentStage: string): number {
  const index = stages.findIndex(s => s.key.toLowerCase() === currentStage.toLowerCase())
  return index >= 0 ? index : 0
}

export function getStatusLabel(stage: string, status: string): string {
  const statusLabels: Record<string, Record<string, string>> = {
    application: {
      profile_incomplete: 'Profile Incomplete',
      documents_pending: 'Documents Required',
      confirmation_pending: 'Confirm Details',
      submitted: 'Submitted',
      under_review: 'Under Review'
    },
    screening: {
      assessment_pending: 'Assessment Pending',
      assessment_completed: 'Assessment Complete',
      awaiting_review: 'Under Review',
      shortlisted: 'Shortlisted',
      rejected: 'Not Selected'
    },
    interview: {
      slot_selection_pending: 'Select Time Slot',
      confirmation_pending: 'Confirm Attendance',
      scheduled: 'Scheduled',
      completed: 'Completed',
      no_show: 'No Show'
    },
    offer: {
      pending: 'Pending',
      review_pending: 'Review Required',
      signature_pending: 'Signature Required',
      accepted: 'Accepted',
      declined: 'Declined',
      negotiating: 'Negotiating'
    },
    onboarding: {
      documents_pending: 'Documents Required',
      form_pending: 'Forms Required',
      in_progress: 'In Progress',
      completed: 'Completed'
    }
  }

  const stageLower = stage.toLowerCase()
  const statusLower = status.toLowerCase()
  
  return statusLabels[stageLower]?.[statusLower] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
