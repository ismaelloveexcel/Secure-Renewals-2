"""Business logic for recruitment operations."""
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recruitment import (
    RecruitmentRequest, Candidate, Interview, Evaluation,
    RECRUITMENT_STAGES, INTERVIEW_TYPES, EMPLOYMENT_TYPES
)
from app.models.passes import Pass
from app.schemas.recruitment import (
    RecruitmentRequestCreate, RecruitmentRequestUpdate,
    CandidateCreate, CandidateUpdate,
    InterviewCreate, InterviewUpdate,
    EvaluationCreate, EvaluationUpdate,
    InterviewSlotsProvide, InterviewSlotConfirm
)


class RecruitmentService:
    """Service for recruitment operations."""

    # =========================================================================
    # RECRUITMENT REQUESTS
    # =========================================================================

    async def create_request(
        self,
        session: AsyncSession,
        data: RecruitmentRequestCreate,
        created_by: str
    ) -> RecruitmentRequest:
        """Create a new recruitment request."""
        # Generate request number
        request_number = await self._generate_request_number(session)

        # Create request
        request = RecruitmentRequest(
            request_number=request_number,
            requested_by=created_by,
            request_date=date.today(),
            status="pending",
            approval_status={
                'requisition': {'status': 'pending', 'approver': None, 'date': None},
                'budget': {'status': 'pending', 'approver': None, 'date': None},
                'offer': {'status': 'pending', 'approver': None, 'date': None}
            },
            **data.model_dump()
        )

        session.add(request)
        await session.commit()
        await session.refresh(request)

        # Create manager pass if hiring manager specified
        if request.hiring_manager_id:
            manager_pass = await self._create_manager_pass(session, request, created_by)
            request.manager_pass_number = manager_pass.pass_number
            await session.commit()
            await session.refresh(request)

        return request

    async def get_request(
        self,
        session: AsyncSession,
        request_id: int
    ) -> Optional[RecruitmentRequest]:
        """Get a recruitment request by ID."""
        result = await session.execute(
            select(RecruitmentRequest).where(RecruitmentRequest.id == request_id)
        )
        return result.scalar_one_or_none()

    async def get_request_by_number(
        self,
        session: AsyncSession,
        request_number: str
    ) -> Optional[RecruitmentRequest]:
        """Get a recruitment request by request number."""
        result = await session.execute(
            select(RecruitmentRequest).where(RecruitmentRequest.request_number == request_number)
        )
        return result.scalar_one_or_none()

    async def list_requests(
        self,
        session: AsyncSession,
        status: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[RecruitmentRequest]:
        """List recruitment requests with optional filters."""
        query = select(RecruitmentRequest)

        filters = []
        if status:
            filters.append(RecruitmentRequest.status == status)
        if department:
            filters.append(RecruitmentRequest.department == department)

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(RecruitmentRequest.created_at.desc())

        result = await session.execute(query)
        return list(result.scalars().all())

    async def update_request(
        self,
        session: AsyncSession,
        request_id: int,
        data: RecruitmentRequestUpdate
    ) -> Optional[RecruitmentRequest]:
        """Update a recruitment request."""
        request = await self.get_request(session, request_id)
        if not request:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(request, key, value)

        await session.commit()
        await session.refresh(request)
        return request

    async def approve_request(
        self,
        session: AsyncSession,
        request_id: int,
        approval_type: str,
        approver_id: str
    ) -> Optional[RecruitmentRequest]:
        """Approve a recruitment request (requisition, budget, or offer)."""
        request = await self.get_request(session, request_id)
        if not request:
            return None

        if approval_type not in ['requisition', 'budget', 'offer']:
            raise ValueError(f"Invalid approval type: {approval_type}")

        # Update approval status
        approval_status = request.approval_status or {}
        approval_status[approval_type] = {
            'status': 'approved',
            'approver': approver_id,
            'date': datetime.now().isoformat()
        }
        request.approval_status = approval_status

        # If requisition and budget approved, move to approved status
        if (approval_status.get('requisition', {}).get('status') == 'approved' and
            approval_status.get('budget', {}).get('status') == 'approved'):
            request.status = 'approved'

        await session.commit()
        await session.refresh(request)
        return request

    # =========================================================================
    # CANDIDATES
    # =========================================================================

    async def add_candidate(
        self,
        session: AsyncSession,
        data: CandidateCreate,
        created_by: str
    ) -> Candidate:
        """Add a new candidate to the pipeline."""
        # Generate candidate number
        candidate_number = await self._generate_candidate_number(session)

        # Create candidate
        candidate = Candidate(
            candidate_number=candidate_number,
            stage='applied',
            status='applied',
            stage_changed_at=datetime.now(),
            **data.model_dump()
        )

        session.add(candidate)
        await session.commit()
        await session.refresh(candidate)

        # Create candidate pass
        candidate_pass = await self._create_candidate_pass(session, candidate, created_by)
        candidate.pass_number = candidate_pass.pass_number
        await session.commit()
        await session.refresh(candidate)

        return candidate

    async def get_candidate(
        self,
        session: AsyncSession,
        candidate_id: int
    ) -> Optional[Candidate]:
        """Get a candidate by ID."""
        result = await session.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )
        return result.scalar_one_or_none()

    async def get_candidate_by_number(
        self,
        session: AsyncSession,
        candidate_number: str
    ) -> Optional[Candidate]:
        """Get a candidate by candidate number."""
        result = await session.execute(
            select(Candidate).where(Candidate.candidate_number == candidate_number)
        )
        return result.scalar_one_or_none()

    async def list_candidates(
        self,
        session: AsyncSession,
        recruitment_request_id: Optional[int] = None,
        stage: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Candidate]:
        """List candidates with optional filters."""
        query = select(Candidate)

        filters = []
        if recruitment_request_id:
            filters.append(Candidate.recruitment_request_id == recruitment_request_id)
        if stage:
            filters.append(Candidate.stage == stage)
        if status:
            filters.append(Candidate.status == status)

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(Candidate.created_at.desc())

        result = await session.execute(query)
        return list(result.scalars().all())

    async def update_candidate(
        self,
        session: AsyncSession,
        candidate_id: int,
        data: CandidateUpdate
    ) -> Optional[Candidate]:
        """Update a candidate."""
        candidate = await self.get_candidate(session, candidate_id)
        if not candidate:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(candidate, key, value)

        await session.commit()
        await session.refresh(candidate)
        return candidate

    async def move_candidate_stage(
        self,
        session: AsyncSession,
        candidate_id: int,
        new_stage: str
    ) -> Candidate:
        """Move candidate to a new stage in the pipeline."""
        candidate = await self.get_candidate(session, candidate_id)
        if not candidate:
            raise ValueError("Candidate not found")

        # Validate stage
        valid_stages = [s['key'] for s in RECRUITMENT_STAGES]
        if new_stage not in valid_stages:
            raise ValueError(f"Invalid stage: {new_stage}")

        # Update stage
        candidate.stage = new_stage
        candidate.stage_changed_at = datetime.now()

        # Update status based on stage
        stage_status_map = {
            'applied': 'applied',
            'screening': 'screening',
            'interview': 'interview',
            'offer': 'offer',
            'hired': 'hired',
            'rejected': 'rejected'
        }
        candidate.status = stage_status_map.get(new_stage, candidate.status)

        await session.commit()
        await session.refresh(candidate)

        return candidate

    async def reject_candidate(
        self,
        session: AsyncSession,
        candidate_id: int,
        reason: str
    ) -> Candidate:
        """Reject a candidate."""
        candidate = await self.get_candidate(session, candidate_id)
        if not candidate:
            raise ValueError("Candidate not found")

        candidate.stage = 'rejected'
        candidate.status = 'rejected'
        candidate.rejection_reason = reason
        candidate.stage_changed_at = datetime.now()

        await session.commit()
        await session.refresh(candidate)

        return candidate

    async def get_pipeline_counts(
        self,
        session: AsyncSession,
        recruitment_request_id: Optional[int] = None
    ) -> Dict[str, int]:
        """Get count of candidates by stage."""
        query = select(Candidate.stage, func.count(Candidate.id))

        if recruitment_request_id:
            query = query.where(Candidate.recruitment_request_id == recruitment_request_id)

        query = query.group_by(Candidate.stage)

        result = await session.execute(query)
        counts = {row[0]: row[1] for row in result.all()}

        # Ensure all stages are present
        for stage in RECRUITMENT_STAGES:
            if stage['key'] not in counts:
                counts[stage['key']] = 0

        return counts

    # =========================================================================
    # INTERVIEWS
    # =========================================================================

    async def create_interview(
        self,
        session: AsyncSession,
        data: InterviewCreate
    ) -> Interview:
        """Create a new interview."""
        # Generate interview number
        interview_number = await self._generate_interview_number(session)

        interview = Interview(
            interview_number=interview_number,
            status='pending',
            **data.model_dump()
        )

        session.add(interview)
        await session.commit()
        await session.refresh(interview)

        return interview

    async def get_interview(
        self,
        session: AsyncSession,
        interview_id: int
    ) -> Optional[Interview]:
        """Get an interview by ID."""
        result = await session.execute(
            select(Interview).where(Interview.id == interview_id)
        )
        return result.scalar_one_or_none()

    async def list_interviews(
        self,
        session: AsyncSession,
        candidate_id: Optional[int] = None,
        recruitment_request_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Interview]:
        """List interviews with optional filters."""
        query = select(Interview)

        filters = []
        if candidate_id:
            filters.append(Interview.candidate_id == candidate_id)
        if recruitment_request_id:
            filters.append(Interview.recruitment_request_id == recruitment_request_id)
        if status:
            filters.append(Interview.status == status)

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(Interview.created_at.desc())

        result = await session.execute(query)
        return list(result.scalars().all())

    async def provide_interview_slots(
        self,
        session: AsyncSession,
        interview_id: int,
        slots: InterviewSlotsProvide
    ) -> Interview:
        """Provide available interview slots (by hiring manager)."""
        interview = await self.get_interview(session, interview_id)
        if not interview:
            raise ValueError("Interview not found")

        # Convert slots to JSON-serializable format
        slots_data = [
            {"start": slot.start.isoformat(), "end": slot.end.isoformat()}
            for slot in slots.available_slots
        ]

        interview.available_slots = {"slots": slots_data}
        interview.status = 'slots_provided'

        await session.commit()
        await session.refresh(interview)

        return interview

    async def confirm_interview_slot(
        self,
        session: AsyncSession,
        interview_id: int,
        confirmation: InterviewSlotConfirm
    ) -> Interview:
        """Confirm an interview slot (by candidate)."""
        interview = await self.get_interview(session, interview_id)
        if not interview:
            raise ValueError("Interview not found")

        interview.scheduled_date = confirmation.selected_slot.start
        interview.status = 'scheduled'
        interview.confirmed_by_candidate = True
        interview.confirmed_at = datetime.now()

        await session.commit()
        await session.refresh(interview)

        return interview

    async def complete_interview(
        self,
        session: AsyncSession,
        interview_id: int,
        notes: Optional[str] = None
    ) -> Interview:
        """Mark an interview as completed."""
        interview = await self.get_interview(session, interview_id)
        if not interview:
            raise ValueError("Interview not found")

        interview.status = 'completed'
        interview.completed_at = datetime.now()
        if notes:
            interview.notes = notes

        await session.commit()
        await session.refresh(interview)

        return interview

    # =========================================================================
    # EVALUATIONS
    # =========================================================================

    async def create_evaluation(
        self,
        session: AsyncSession,
        data: EvaluationCreate,
        evaluator_id: str
    ) -> Evaluation:
        """Create a new evaluation."""
        # Generate evaluation number
        evaluation_number = await self._generate_evaluation_number(session)

        evaluation = Evaluation(
            evaluation_number=evaluation_number,
            evaluator_id=evaluator_id,
            **data.model_dump()
        )

        session.add(evaluation)
        await session.commit()
        await session.refresh(evaluation)

        return evaluation

    async def get_evaluation(
        self,
        session: AsyncSession,
        evaluation_id: int
    ) -> Optional[Evaluation]:
        """Get an evaluation by ID."""
        result = await session.execute(
            select(Evaluation).where(Evaluation.id == evaluation_id)
        )
        return result.scalar_one_or_none()

    async def list_evaluations(
        self,
        session: AsyncSession,
        candidate_id: Optional[int] = None,
        interview_id: Optional[int] = None
    ) -> List[Evaluation]:
        """List evaluations with optional filters."""
        query = select(Evaluation)

        filters = []
        if candidate_id:
            filters.append(Evaluation.candidate_id == candidate_id)
        if interview_id:
            filters.append(Evaluation.interview_id == interview_id)

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(Evaluation.created_at.desc())

        result = await session.execute(query)
        return list(result.scalars().all())

    # =========================================================================
    # STATISTICS
    # =========================================================================

    async def get_stats(self, session: AsyncSession) -> Dict[str, Any]:
        """Get recruitment statistics."""
        # Count requests
        total_requests = await session.execute(
            select(func.count(RecruitmentRequest.id))
        )
        active_requests = await session.execute(
            select(func.count(RecruitmentRequest.id)).where(
                RecruitmentRequest.status.in_(['pending', 'approved'])
            )
        )

        # Count candidates
        total_candidates = await session.execute(
            select(func.count(Candidate.id))
        )

        # Get pipeline counts
        pipeline_counts = await self.get_pipeline_counts(session)

        # Count by source
        source_result = await session.execute(
            select(Candidate.source, func.count(Candidate.id))
            .where(Candidate.source.isnot(None))
            .group_by(Candidate.source)
        )
        by_source = {row[0]: row[1] for row in source_result.all()}

        # Recent hires (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_hires = await session.execute(
            select(func.count(Candidate.id)).where(
                and_(
                    Candidate.stage == 'hired',
                    Candidate.stage_changed_at >= thirty_days_ago
                )
            )
        )

        return {
            "total_requests": total_requests.scalar() or 0,
            "active_requests": active_requests.scalar() or 0,
            "total_candidates": total_candidates.scalar() or 0,
            "by_stage": pipeline_counts,
            "by_source": by_source,
            "recent_hires": recent_hires.scalar() or 0
        }

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    async def _generate_request_number(self, session: AsyncSession) -> str:
        """Generate unique request number: RRF-YYYYMMDD-XXXX."""
        today = date.today().strftime('%Y%m%d')

        # Get count of requests created today
        result = await session.execute(
            select(func.count(RecruitmentRequest.id)).where(
                RecruitmentRequest.request_number.like(f'RRF-{today}-%')
            )
        )
        count = result.scalar() or 0

        return f"RRF-{today}-{count + 1:04d}"

    async def _generate_candidate_number(self, session: AsyncSession) -> str:
        """Generate unique candidate number: CAN-YYYYMMDD-XXXX."""
        today = date.today().strftime('%Y%m%d')

        result = await session.execute(
            select(func.count(Candidate.id)).where(
                Candidate.candidate_number.like(f'CAN-{today}-%')
            )
        )
        count = result.scalar() or 0

        return f"CAN-{today}-{count + 1:04d}"

    async def _generate_interview_number(self, session: AsyncSession) -> str:
        """Generate unique interview number: INT-YYYYMMDD-XXXX."""
        today = date.today().strftime('%Y%m%d')

        result = await session.execute(
            select(func.count(Interview.id)).where(
                Interview.interview_number.like(f'INT-{today}-%')
            )
        )
        count = result.scalar() or 0

        return f"INT-{today}-{count + 1:04d}"

    async def _generate_evaluation_number(self, session: AsyncSession) -> str:
        """Generate unique evaluation number: EVL-YYYYMMDD-XXXX."""
        today = date.today().strftime('%Y%m%d')

        result = await session.execute(
            select(func.count(Evaluation.id)).where(
                Evaluation.evaluation_number.like(f'EVL-{today}-%')
            )
        )
        count = result.scalar() or 0

        return f"EVL-{today}-{count + 1:04d}"

    async def _create_manager_pass(
        self,
        session: AsyncSession,
        request: RecruitmentRequest,
        created_by: str
    ) -> Pass:
        """Create manager pass for hiring manager."""
        # Generate pass number
        today = date.today().strftime('%Y%m%d')
        result = await session.execute(
            select(func.count(Pass.id)).where(Pass.pass_number.like(f'MGR-{today}-%'))
        )
        count = result.scalar() or 0
        pass_number = f"MGR-{today}-{count + 1:04d}"

        # Create pass
        manager_pass = Pass(
            pass_number=pass_number,
            pass_type='recruitment',  # Using existing pass type
            full_name=request.hiring_manager_id or "Hiring Manager",
            department=request.department,
            position=request.position_title,
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=90),  # 3 months
            purpose=f"Recruitment: {request.position_title} (Request: {request.request_number})",
            status='active',
            created_by=created_by
        )

        session.add(manager_pass)
        await session.commit()
        await session.refresh(manager_pass)

        return manager_pass

    async def _create_candidate_pass(
        self,
        session: AsyncSession,
        candidate: Candidate,
        created_by: str
    ) -> Pass:
        """Create recruitment pass for candidate."""
        # Generate pass number
        today = date.today().strftime('%Y%m%d')
        result = await session.execute(
            select(func.count(Pass.id)).where(Pass.pass_number.like(f'REC-{today}-%'))
        )
        count = result.scalar() or 0
        pass_number = f"REC-{today}-{count + 1:04d}"

        # Create pass
        candidate_pass = Pass(
            pass_number=pass_number,
            pass_type='recruitment',
            full_name=candidate.full_name,
            email=candidate.email,
            phone=candidate.phone,
            position=candidate.current_position,
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=60),  # 2 months
            purpose=f"Candidate application (Ref: {candidate.candidate_number})",
            status='active',
            created_by=created_by
        )

        session.add(candidate_pass)
        await session.commit()
        await session.refresh(candidate_pass)

        return candidate_pass

    def get_stages(self) -> List[Dict[str, Any]]:
        """Get list of recruitment stages."""
        return RECRUITMENT_STAGES

    def get_interview_types(self) -> List[Dict[str, str]]:
        """Get list of interview types."""
        return INTERVIEW_TYPES

    def get_employment_types(self) -> List[Dict[str, str]]:
        """Get list of employment types."""
        return EMPLOYMENT_TYPES


# Singleton instance
recruitment_service = RecruitmentService()
