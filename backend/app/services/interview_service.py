"""Interview scheduling service."""
import secrets
from datetime import datetime, date, time, timedelta
from typing import Optional, List
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.interview import InterviewSetup, InterviewSlot, PassMessage, RecruitmentDocument
from app.models.recruitment import Candidate, RecruitmentRequest
from app.models.activity_log import ActivityLog
from app.schemas.interview import (
    InterviewSetupCreate, InterviewSetupUpdate, InterviewSetupResponse,
    InterviewSlotCreate, InterviewSlotBulkCreate, InterviewSlotResponse,
    SlotBookingRequest, PassMessageCreate, PassMessageResponse,
    RecruitmentDocumentCreate, RecruitmentDocumentResponse,
    CandidatePassData, ManagerPassData, ActivityLogResponse
)


class InterviewService:
    """Service for interview scheduling."""
    
    @staticmethod
    def generate_pass_token() -> str:
        """Generate secure token for pass access."""
        return secrets.token_urlsafe(32)
    
    async def create_interview_setup(
        self, session: AsyncSession, data: InterviewSetupCreate, created_by: str
    ) -> InterviewSetupResponse:
        """Create interview setup for a position."""
        setup = InterviewSetup(
            recruitment_request_id=data.recruitment_request_id,
            created_by=created_by,
            technical_assessment_required=data.technical_assessment_required,
            interview_format=data.interview_format,
            interview_rounds=data.interview_rounds,
            additional_interviewers=data.additional_interviewers,
            notes=data.notes
        )
        session.add(setup)
        await session.commit()
        await session.refresh(setup)
        return InterviewSetupResponse.model_validate(setup)
    
    async def get_interview_setup(
        self, session: AsyncSession, recruitment_request_id: int
    ) -> Optional[InterviewSetupResponse]:
        """Get interview setup for a position."""
        result = await session.execute(
            select(InterviewSetup).where(
                InterviewSetup.recruitment_request_id == recruitment_request_id
            )
        )
        setup = result.scalar_one_or_none()
        if setup:
            return InterviewSetupResponse.model_validate(setup)
        return None
    
    async def update_interview_setup(
        self, session: AsyncSession, setup_id: int, data: InterviewSetupUpdate
    ) -> InterviewSetupResponse:
        """Update interview setup."""
        result = await session.execute(
            select(InterviewSetup).where(InterviewSetup.id == setup_id)
        )
        setup = result.scalar_one_or_none()
        if not setup:
            raise HTTPException(status_code=404, detail="Interview setup not found")
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(setup, field, value)
        
        await session.commit()
        await session.refresh(setup)
        return InterviewSetupResponse.model_validate(setup)
    
    async def create_slots_bulk(
        self, session: AsyncSession, data: InterviewSlotBulkCreate
    ) -> List[InterviewSlotResponse]:
        """Create multiple interview slots at once."""
        slots = []
        for slot_date in data.dates:
            for time_slot in data.time_slots:
                start_time = time.fromisoformat(time_slot["start_time"])
                end_time = time.fromisoformat(time_slot["end_time"])
                
                slot = InterviewSlot(
                    interview_setup_id=data.interview_setup_id,
                    slot_date=slot_date,
                    start_time=start_time,
                    end_time=end_time,
                    round_number=data.round_number,
                    status="available"
                )
                session.add(slot)
                slots.append(slot)
        
        await session.commit()
        for slot in slots:
            await session.refresh(slot)
        
        return [InterviewSlotResponse.model_validate(s) for s in slots]
    
    async def get_available_slots(
        self, session: AsyncSession, recruitment_request_id: int, round_number: int = 1
    ) -> List[InterviewSlotResponse]:
        """Get available interview slots for a position."""
        # Get setup first
        setup_result = await session.execute(
            select(InterviewSetup).where(
                InterviewSetup.recruitment_request_id == recruitment_request_id
            )
        )
        setup = setup_result.scalar_one_or_none()
        if not setup:
            return []
        
        # Get available slots
        result = await session.execute(
            select(InterviewSlot).where(
                and_(
                    InterviewSlot.interview_setup_id == setup.id,
                    InterviewSlot.status == "available",
                    InterviewSlot.round_number == round_number,
                    InterviewSlot.slot_date >= date.today()
                )
            ).order_by(InterviewSlot.slot_date, InterviewSlot.start_time)
        )
        slots = result.scalars().all()
        return [InterviewSlotResponse.model_validate(s) for s in slots]
    
    async def book_slot(
        self, session: AsyncSession, slot_id: int, candidate_id: int
    ) -> InterviewSlotResponse:
        """Book an interview slot for a candidate."""
        result = await session.execute(
            select(InterviewSlot).where(InterviewSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()
        
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        if slot.status != "available":
            raise HTTPException(status_code=400, detail="Slot is no longer available")
        
        slot.status = "booked"
        slot.booked_by_candidate_id = candidate_id
        slot.booked_at = datetime.utcnow()
        
        await session.commit()
        await session.refresh(slot)
        
        # Get candidate name
        cand_result = await session.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )
        candidate = cand_result.scalar_one_or_none()
        
        response = InterviewSlotResponse.model_validate(slot)
        if candidate:
            response.candidate_name = candidate.full_name
            await self.log_activity(
                session,
                candidate_id=candidate_id,
                stage="Interview",
                action_type="interview_booked",
                action_description=f"Interview slot booked for {slot.slot_date.strftime('%d %b %Y')} at {slot.start_time.strftime('%H:%M')}",
                performed_by="candidate",
                performed_by_id=str(candidate_id),
                visibility="candidate"
            )
        
        return response
    
    async def confirm_slot(
        self, session: AsyncSession, slot_id: int, candidate_id: int
    ) -> InterviewSlotResponse:
        """Confirm a booked slot."""
        result = await session.execute(
            select(InterviewSlot).where(
                and_(
                    InterviewSlot.id == slot_id,
                    InterviewSlot.booked_by_candidate_id == candidate_id
                )
            )
        )
        slot = result.scalar_one_or_none()
        
        if not slot:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        slot.candidate_confirmed = True
        slot.candidate_confirmed_at = datetime.utcnow()
        
        await session.commit()
        await session.refresh(slot)
        
        await self.log_activity(
            session,
            candidate_id=candidate_id,
            stage="Interview",
            action_type="interview_confirmed",
            action_description=f"Interview confirmed for {slot.slot_date.strftime('%d %b %Y')} at {slot.start_time.strftime('%H:%M')}",
            performed_by="candidate",
            performed_by_id=str(candidate_id),
            visibility="candidate"
        )
        
        return InterviewSlotResponse.model_validate(slot)
    
    async def get_confirmed_interviews(
        self, session: AsyncSession, recruitment_request_id: int
    ) -> List[InterviewSlotResponse]:
        """Get all confirmed interviews for a position."""
        setup_result = await session.execute(
            select(InterviewSetup).where(
                InterviewSetup.recruitment_request_id == recruitment_request_id
            )
        )
        setup = setup_result.scalar_one_or_none()
        if not setup:
            return []
        
        result = await session.execute(
            select(InterviewSlot, Candidate).join(
                Candidate, InterviewSlot.booked_by_candidate_id == Candidate.id
            ).where(
                and_(
                    InterviewSlot.interview_setup_id == setup.id,
                    InterviewSlot.candidate_confirmed == True
                )
            ).order_by(InterviewSlot.slot_date, InterviewSlot.start_time)
        )
        
        responses = []
        for slot, candidate in result.all():
            resp = InterviewSlotResponse.model_validate(slot)
            resp.candidate_name = candidate.full_name
            responses.append(resp)
        
        return responses
    
    async def create_message(
        self, session: AsyncSession, data: PassMessageCreate
    ) -> PassMessageResponse:
        """Create a message in the inbox."""
        message = PassMessage(
            pass_type=data.pass_type,
            pass_holder_id=data.pass_holder_id,
            recruitment_request_id=data.recruitment_request_id,
            sender_type=data.sender_type,
            sender_id=data.sender_id,
            subject=data.subject,
            message_body=data.message_body,
            message_type=data.message_type,
            attachments=data.attachments
        )
        session.add(message)
        await session.commit()
        await session.refresh(message)
        return PassMessageResponse.model_validate(message)
    
    async def get_inbox(
        self, session: AsyncSession, pass_type: str, pass_holder_id: int
    ) -> List[PassMessageResponse]:
        """Get inbox messages for a pass holder."""
        result = await session.execute(
            select(PassMessage).where(
                and_(
                    PassMessage.pass_type == pass_type,
                    PassMessage.pass_holder_id == pass_holder_id
                )
            ).order_by(PassMessage.created_at.desc())
        )
        messages = result.scalars().all()
        return [PassMessageResponse.model_validate(m) for m in messages]
    
    async def mark_message_read(
        self, session: AsyncSession, message_id: int
    ) -> PassMessageResponse:
        """Mark a message as read."""
        result = await session.execute(
            select(PassMessage).where(PassMessage.id == message_id)
        )
        message = result.scalar_one_or_none()
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        message.is_read = True
        message.read_at = datetime.utcnow()
        await session.commit()
        await session.refresh(message)
        return PassMessageResponse.model_validate(message)
    
    async def get_unread_count(
        self, session: AsyncSession, pass_type: str, pass_holder_id: int
    ) -> int:
        """Get count of unread messages."""
        result = await session.execute(
            select(func.count(PassMessage.id)).where(
                and_(
                    PassMessage.pass_type == pass_type,
                    PassMessage.pass_holder_id == pass_holder_id,
                    PassMessage.is_read == False
                )
            )
        )
        return result.scalar() or 0
    
    async def create_document(
        self, session: AsyncSession, data: RecruitmentDocumentCreate, submitted_by: str
    ) -> RecruitmentDocumentResponse:
        """Create a recruitment document entry."""
        doc = RecruitmentDocument(
            recruitment_request_id=data.recruitment_request_id,
            document_type=data.document_type,
            document_name=data.document_name,
            file_path=data.file_path,
            status="submitted",
            submitted_by=submitted_by,
            submitted_at=datetime.utcnow()
        )
        session.add(doc)
        await session.commit()
        await session.refresh(doc)
        return RecruitmentDocumentResponse.model_validate(doc)
    
    async def get_documents(
        self, session: AsyncSession, recruitment_request_id: int
    ) -> List[RecruitmentDocumentResponse]:
        """Get all documents for a position."""
        result = await session.execute(
            select(RecruitmentDocument).where(
                RecruitmentDocument.recruitment_request_id == recruitment_request_id
            ).order_by(RecruitmentDocument.document_type)
        )
        docs = result.scalars().all()
        return [RecruitmentDocumentResponse.model_validate(d) for d in docs]
    
    async def get_candidate_pass_data(
        self, session: AsyncSession, candidate_id: int
    ) -> CandidatePassData:
        """Get full pass data for a candidate."""
        # Get candidate with position
        result = await session.execute(
            select(Candidate, RecruitmentRequest).join(
                RecruitmentRequest, Candidate.recruitment_request_id == RecruitmentRequest.id
            ).where(Candidate.id == candidate_id)
        )
        row = result.first()
        if not row:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        candidate, position = row
        
        # Correct Stage/Status Mapping logic based on user list
        stage_mapping = {
            "application": ["Submitted", "Incomplete (Missing Information)", "Withdrawn by Candidate", "Application Received (Validated)"],
            "screening": ["Under Screening", "Shortlisted", "On Hold", "Rejected at Screening"],
            "interview": ["Interview Scheduled", "Interview Completed", "Second Interview Required (if applicable)", "Pending Interview Feedback", "Rejected After Interview"],
            "offer": ["Offer In Preparation", "Offer Sent", "Offer Accepted", "Offer Declined", "Offer Expired", "Offer Withdrawn"],
            "onboarding": ["Onboarding Initiated", "Documents Pending", "Background / Clearance in Progress", "Onboarding Completed", "No Show / Onboarding Failed"]
        }

        all_stages = ["Application", "Screening", "Interview", "Offer", "Onboarding"]
        current_stage_idx = 0
        current_stage_name = str(candidate.stage).strip()
        
        # Match case-insensitive
        for idx, stage in enumerate(all_stages):
            if stage.lower() == current_stage_name.lower():
                current_stage_idx = idx
                break
        
        stages = []
        for i, stage in enumerate(all_stages):
            if i < current_stage_idx:
                stage_status = "completed"
            elif i == current_stage_idx:
                stage_status = "current"
            else:
                stage_status = "pending"
            stages.append({"name": stage, "status": stage_status, "timestamp": None})

        # Correct display status based on candidate.status matching the list
        # We'll use the mapping to ensure the status matches the list exactly if possible
        display_status = str(candidate.status).strip()
        
        # If the status in DB is a slug, we should ideally map it to the label
        # But based on user feedback "Applied" vs "applied", they want the exact label
        # Let's check if the status is one of our slugs and map to label
        status_slug_to_label = {
            "submitted": "Submitted",
            "incomplete": "Incomplete (Missing Information)",
            "withdrawn": "Withdrawn by Candidate",
            "received": "Application Received (Validated)",
            "under_screening": "Under Screening",
            "shortlisted": "Shortlisted",
            "on_hold": "On Hold",
            "rejected_screening": "Rejected at Screening",
            "interview_scheduled": "Interview Scheduled",
            "interview_completed": "Interview Completed",
            "second_interview": "Second Interview Required (if applicable)",
            "pending_feedback": "Pending Interview Feedback",
            "rejected_interview": "Rejected After Interview",
            "offer_preparation": "Offer In Preparation",
            "offer_sent": "Offer Sent",
            "offer_accepted": "Offer Accepted",
            "offer_declined": "Offer Declined",
            "offer_expired": "Offer Expired",
            "offer_withdrawn": "Offer Withdrawn",
            "onboarding_initiated": "Onboarding Initiated",
            "documents_pending": "Documents Pending",
            "clearance_in_progress": "Background / Clearance in Progress",
            "onboarding_completed": "Onboarding Completed",
            "no_show": "No Show / Onboarding Failed"
        }
        
        final_status = status_slug_to_label.get(display_status.lower(), display_status)

        # Get available slots
        available_slots = await self.get_available_slots(session, position.id)
        
        # Get booked slot if any
        slot_result = await session.execute(
            select(InterviewSlot).where(
                InterviewSlot.booked_by_candidate_id == candidate_id
            ).order_by(InterviewSlot.slot_date.desc())
        )
        booked_slot = slot_result.scalar_one_or_none()
        booked_slot_response = InterviewSlotResponse.model_validate(booked_slot) if booked_slot else None
        
        # Get unread messages
        unread = await self.get_unread_count(session, "candidate", candidate_id)
        
        # Build next actions based on stage
        next_actions = []
        c_stage_lower = current_stage_name.lower()
        if c_stage_lower == "application":
            next_actions.append({"action_id": "complete_profile", "label": "Complete Profile", "type": "form"})
        elif c_stage_lower == "screening":
            next_actions.append({"action_id": "upload_documents", "label": "Upload Documents", "type": "upload"})
        elif c_stage_lower == "interview":
            if not booked_slot:
                next_actions.append({"action_id": "book_interview", "label": "Choose Interview Slot", "type": "calendar"})
            elif not booked_slot.candidate_confirmed:
                next_actions.append({"action_id": "confirm_interview", "label": "Confirm Interview", "type": "confirm"})
        elif c_stage_lower == "offer":
            next_actions.append({"action_id": "review_offer", "label": "Review Offer", "type": "document"})
        
        # Get candidate-visible activity history
        activity_history = await self.get_candidate_activity_history(session, candidate_id)
        
        return CandidatePassData(
            pass_id=f"CPASS-{candidate.candidate_number}",
            pass_token=self.generate_pass_token(),
            candidate_id=candidate.id,
            candidate_number=candidate.candidate_number,
            full_name=candidate.full_name,
            email=candidate.email,
            phone=candidate.phone,
            position_title=position.position_title,
            position_id=position.id,
            entity=candidate.entity,
            current_stage=all_stages[current_stage_idx], # Ensure exact casing
            status=final_status, # Use the mapped label
            stages=stages,
            interview_slots=available_slots,
            booked_slot=booked_slot_response,
            unread_messages=unread,
            next_actions=next_actions,
            activity_history=activity_history
        )
    
    async def get_manager_pass_data(
        self, session: AsyncSession, recruitment_request_id: int, manager_id: str
    ) -> ManagerPassData:
        """Get full pass data for a hiring manager."""
        # Get position
        result = await session.execute(
            select(RecruitmentRequest).where(RecruitmentRequest.id == recruitment_request_id)
        )
        position = result.scalar_one_or_none()
        if not position:
            raise HTTPException(status_code=404, detail="Position not found")
        
        # Calculate SLA days
        sla_days = (datetime.utcnow().date() - position.created_at.date()).days
        
        # Get documents
        documents = await self.get_documents(session, recruitment_request_id)
        
        # Check JD and Recruitment Form status
        jd_status = "pending"
        rf_status = "pending"
        for doc in documents:
            if doc.document_type == "job_description":
                jd_status = doc.status
            elif doc.document_type == "recruitment_form":
                rf_status = doc.status
        
        # Get pipeline stats
        pipeline_result = await session.execute(
            select(Candidate.stage, func.count(Candidate.id)).where(
                Candidate.recruitment_request_id == recruitment_request_id
            ).group_by(Candidate.stage)
        )
        pipeline_stats = {row[0]: row[1] for row in pipeline_result.all()}
        total_candidates = sum(pipeline_stats.values())
        
        # Get interview setup
        interview_setup = await self.get_interview_setup(session, recruitment_request_id)
        
        # Get confirmed interviews
        confirmed = await self.get_confirmed_interviews(session, recruitment_request_id)
        
        # Get unread messages (using position id as holder id for manager)
        unread = await self.get_unread_count(session, "manager", recruitment_request_id)
        
        return ManagerPassData(
            pass_id=f"MPASS-{position.request_number}",
            pass_token=self.generate_pass_token(),
            manager_id=manager_id,
            manager_name=position.hiring_manager_id or "Hiring Manager",
            department=position.department,
            position_id=position.id,
            position_title=position.position_title,
            position_status=position.status,
            sla_days=sla_days,
            documents=documents,
            jd_status=jd_status,
            recruitment_form_status=rf_status,
            pipeline_stats=pipeline_stats,
            total_candidates=total_candidates,
            interview_setup=interview_setup,
            confirmed_interviews=confirmed,
            unread_messages=unread
        )

    async def log_activity(
        self, 
        session: AsyncSession, 
        candidate_id: int,
        stage: str,
        action_type: str,
        action_description: str,
        performed_by: str = "system",
        performed_by_id: str = None,
        visibility: str = "internal"
    ) -> ActivityLog:
        """Log an activity entry (immutable audit trail)."""
        log = ActivityLog(
            entity_type="candidate",
            entity_id=str(candidate_id),
            stage=stage,
            action_type=action_type,
            action_description=action_description,
            performed_by=performed_by,
            performed_by_id=performed_by_id,
            visibility=visibility,
            timestamp=datetime.utcnow()
        )
        session.add(log)
        await session.commit()
        await session.refresh(log)
        return log

    async def get_candidate_activity_history(
        self, session: AsyncSession, candidate_id: int
    ) -> List[ActivityLogResponse]:
        """Get candidate-visible activity history only."""
        result = await session.execute(
            select(ActivityLog).where(
                and_(
                    ActivityLog.entity_type == "candidate",
                    ActivityLog.entity_id == str(candidate_id),
                    ActivityLog.visibility == "candidate"
                )
            ).order_by(ActivityLog.timestamp.desc()).limit(20)
        )
        logs = result.scalars().all()
        return [ActivityLogResponse.model_validate(l) for l in logs]

    async def get_full_activity_history(
        self, session: AsyncSession, candidate_id: int
    ) -> List[ActivityLogResponse]:
        """Get full activity history (HR/admin only)."""
        result = await session.execute(
            select(ActivityLog).where(
                and_(
                    ActivityLog.entity_type == "candidate",
                    ActivityLog.entity_id == str(candidate_id)
                )
            ).order_by(ActivityLog.timestamp.desc())
        )
        logs = result.scalars().all()
        return [ActivityLogResponse.model_validate(l) for l in logs]


interview_service = InterviewService()
