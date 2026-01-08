from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import uuid
import io
import msoffcrypto
import pandas as pd

from app.database import get_session
from app.models import (
    InsuranceCensusRecord, InsuranceCensusImportBatch, Employee, 
    MANDATORY_FIELDS, MANDATORY_FIELDS_FOR_RENEWAL,
    DHA_DOH_VALIDATION_FIELDS, AMENDMENT_TRACKED_FIELDS
)
from app.auth.dependencies import require_role

router = APIRouter(
    prefix="/insurance-census",
    tags=["insurance-census"],
    dependencies=[Depends(require_role(["admin", "hr"]))],
)

EXCEL_PASSWORD = "0001A"


def apply_record_updates(record: InsuranceCensusRecord, update_data: Dict[str, Any]) -> None:
    """
    Apply updates to a census record, tracking amendments for fields in AMENDMENT_TRACKED_FIELDS.
    """
    for field, value in update_data.items():
        if value is not None:
            old_value = getattr(record, field, None)
            if old_value != value and field in AMENDMENT_TRACKED_FIELDS:
                record.mark_field_as_amended(field)
            setattr(record, field, value)


COLUMN_MAPPING = {
    'SR NO.': 'sr_no',
    'FIRST NAME': 'first_name',
    'SECOND NAME': 'second_name',
    'FAMILY/ LAST/ SUR NAME': 'family_name',
    'FULL NAME': 'full_name',
    'DOB': 'dob',
    'DOB ': 'dob',
    'GENDER': 'gender',
    'GENDER  ': 'gender',
    'MARITAL STATUS': 'marital_status',
    'MARITAL STATUS ': 'marital_status',
    'MATERNITY COVERAGE': 'maternity_coverage',
    'RELATION': 'relation',
    'STAFF ID': 'staff_id',
    'EMPLOYEE CARD NUMBER': 'employee_card_number',
    'CATEGORY': 'category',
    'SUB-GROUP NAME': 'sub_group_name',
    'BILLING ENTITY': 'billing_entity',
    'DEPARTMENT': 'department',
    'NATIONALITY': 'nationality',
    'EFFECTIVE DATE OF ADDITION': 'effective_date',
    'EMIRATES ID NUMBER': 'emirates_id_number',
    'EMIRATES ID APPLICATION NUMBER': 'emirates_id_application_number',
    'If Emirates ID is under processing please mention if the member is an Emirati or an Expat or a New born child': 'emirates_id_processing_note',
    'BIRTH NOTIFICATION NO. (OR) BIRTH CERTIFICATE ID': 'birth_notification_no',
    'UID Number': 'uid_number',
    'GDRFA File Number (or) Entity Permit No.': 'gdrfa_file_number',
    'COUNTRY OF RESIDENCY': 'country_of_residency',
    'MEMBER TYPE': 'member_type',
    'OCCUPATION AS PER MINISTRY OF INTERIOR': 'occupation',
    'EMIRATE OF RESIDENCY': 'emirate_of_residency',
    'RESIDENCY LOCATION': 'residency_location',
    'EMIRATES OF WORK LOCATION': 'emirate_of_work',
    'WORK LOCATION': 'work_location',
    'EMIRATES OF VISA ISSUANCE': 'emirate_of_visa',
    'PASSPORT NUMBER': 'passport_number',
    'SALARY': 'salary',
    'COMMISSION': 'commission',
    'Establishment Type': 'establishment_type',
    'EntityID': 'entity_id',
    'Company Phone number': 'company_phone',
    'Company HR Email ID': 'company_email',
    'LANDLINE NO.': 'landline_no',
    'PERSONAL MOBILE NO': 'mobile_no',
    'PERSONAL  EMAIL': 'personal_email',
    'VIP': 'vip',
    'HEIGHT': 'height',
    'WEIGHT': 'weight',
}


class CensusRecordUpdate(BaseModel):
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    family_name: Optional[str] = None
    full_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    maternity_coverage: Optional[str] = None
    relation: Optional[str] = None
    staff_id: Optional[str] = None
    employee_card_number: Optional[str] = None
    category: Optional[str] = None
    sub_group_name: Optional[str] = None
    billing_entity: Optional[str] = None
    department: Optional[str] = None
    nationality: Optional[str] = None
    effective_date: Optional[str] = None
    emirates_id_number: Optional[str] = None
    emirates_id_application_number: Optional[str] = None
    emirates_id_processing_note: Optional[str] = None
    birth_notification_no: Optional[str] = None
    uid_number: Optional[str] = None
    gdrfa_file_number: Optional[str] = None
    country_of_residency: Optional[str] = None
    member_type: Optional[str] = None
    occupation: Optional[str] = None
    emirate_of_residency: Optional[str] = None
    residency_location: Optional[str] = None
    emirate_of_work: Optional[str] = None
    work_location: Optional[str] = None
    emirate_of_visa: Optional[str] = None
    passport_number: Optional[str] = None
    salary: Optional[str] = None
    commission: Optional[str] = None
    establishment_type: Optional[str] = None
    entity_id: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    landline_no: Optional[str] = None
    mobile_no: Optional[str] = None
    personal_email: Optional[str] = None
    vip: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    # Renewal status and tracking
    renewal_status: Optional[str] = None  # 'existing', 'addition', 'deletion'
    renewal_effective_date: Optional[str] = None


@router.get("")
async def list_census_records(
    db: AsyncSession = Depends(get_session),
    entity: Optional[str] = Query(None),
    insurance_type: Optional[str] = Query(None),
    relation: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    missing_fields_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
):
    query = select(InsuranceCensusRecord)
    
    if entity:
        query = query.where(InsuranceCensusRecord.entity == entity)
    if insurance_type:
        query = query.where(InsuranceCensusRecord.insurance_type == insurance_type)
    if relation:
        query = query.where(InsuranceCensusRecord.relation.ilike(f"%{relation}%"))
    if search:
        search_term = f"%{search}%"
        query = query.where(or_(
            InsuranceCensusRecord.full_name.ilike(search_term),
            InsuranceCensusRecord.staff_id.ilike(search_term),
            InsuranceCensusRecord.emirates_id_number.ilike(search_term),
            InsuranceCensusRecord.employee_card_number.ilike(search_term),
        ))
    if missing_fields_only:
        query = query.where(InsuranceCensusRecord.completeness_pct < 100)
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(InsuranceCensusRecord.id)
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    records = result.scalars().all()
    
    return {
        "records": [r.to_dict() for r in records],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "mandatory_fields": MANDATORY_FIELDS + MANDATORY_FIELDS_FOR_RENEWAL,
        "dha_doh_validation_fields": DHA_DOH_VALIDATION_FIELDS,
        "amendment_tracked_fields": AMENDMENT_TRACKED_FIELDS,
    }


@router.get("/summary")
@router.get("/stats")
async def get_census_stats(db: AsyncSession = Depends(get_session)):
    total_query = select(func.count()).select_from(InsuranceCensusRecord)
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0
    
    complete_query = select(func.count()).select_from(InsuranceCensusRecord).where(
        InsuranceCensusRecord.completeness_pct == 100
    )
    complete_result = await db.execute(complete_query)
    complete = complete_result.scalar() or 0
    
    entity_query = select(
        InsuranceCensusRecord.entity,
        func.count()
    ).group_by(InsuranceCensusRecord.entity)
    entity_result = await db.execute(entity_query)
    by_entity = {row[0]: row[1] for row in entity_result.fetchall()}
    
    type_query = select(
        InsuranceCensusRecord.insurance_type,
        func.count()
    ).group_by(InsuranceCensusRecord.insurance_type)
    type_result = await db.execute(type_query)
    by_type = {row[0]: row[1] for row in type_result.fetchall()}
    
    linked_query = select(func.count()).select_from(InsuranceCensusRecord).where(
        InsuranceCensusRecord.employee_id.isnot(None)
    )
    linked_result = await db.execute(linked_query)
    linked = linked_result.scalar() or 0
    
    avg_completeness_query = select(func.avg(InsuranceCensusRecord.completeness_pct))
    avg_result = await db.execute(avg_completeness_query)
    avg_completeness = avg_result.scalar() or 0
    
    return {
        "total": total,
        "complete": complete,
        "incomplete": total - complete,
        "linked": linked,
        "by_entity": by_entity,
        "by_insurance_type": by_type,
        "avg_completeness": float(avg_completeness),
    }


@router.get("/{record_id}")
async def get_census_record(record_id: int, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(InsuranceCensusRecord).where(InsuranceCensusRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record.to_dict()


@router.put("/{record_id}")
async def update_census_record(
    record_id: int,
    data: CensusRecordUpdate,
    db: AsyncSession = Depends(get_session),
    updated_by: str = Query("system"),
):
    result = await db.execute(
        select(InsuranceCensusRecord).where(InsuranceCensusRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    update_data = data.model_dump(exclude_unset=True)
    apply_record_updates(record, update_data)
    
    record.updated_by = updated_by
    record.updated_at = datetime.utcnow()
    record.calculate_completeness()
    
    if record.staff_id:
        emp_result = await db.execute(
            select(Employee).where(Employee.employee_id == record.staff_id)
        )
        emp = emp_result.scalar_one_or_none()
        if emp:
            record.employee_id = emp.id
    
    await db.commit()
    await db.refresh(record)
    return record.to_dict()


class BatchUpdateItem(BaseModel):
    id: int
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    family_name: Optional[str] = None
    full_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    relation: Optional[str] = None
    staff_id: Optional[str] = None
    category: Optional[str] = None
    nationality: Optional[str] = None
    effective_date: Optional[str] = None
    emirates_id_number: Optional[str] = None
    uid_number: Optional[str] = None
    gdrfa_file_number: Optional[str] = None
    passport_number: Optional[str] = None
    mobile_no: Optional[str] = None
    sr_no: Optional[str] = None
    marital_status: Optional[str] = None
    # Renewal status tracking
    renewal_status: Optional[str] = None  # 'existing', 'addition', 'deletion'
    renewal_effective_date: Optional[str] = None


class BatchUpdateRequest(BaseModel):
    updates: List[BatchUpdateItem]


@router.put("/batch-update")
async def batch_update_census_records(
    data: BatchUpdateRequest,
    db: AsyncSession = Depends(get_session),
    updated_by: str = Query("system"),
):
    updated_count = 0
    
    for item in data.updates:
        result = await db.execute(
            select(InsuranceCensusRecord).where(InsuranceCensusRecord.id == item.id)
        )
        record = result.scalar_one_or_none()
        if not record:
            continue
        
        update_data = item.model_dump(exclude_unset=True, exclude={"id"})
        apply_record_updates(record, update_data)
        
        record.updated_by = updated_by
        record.updated_at = datetime.utcnow()
        record.calculate_completeness()
        
        if record.staff_id:
            emp_result = await db.execute(
                select(Employee).where(Employee.employee_id == record.staff_id)
            )
            emp = emp_result.scalar_one_or_none()
            if emp:
                record.employee_id = emp.id
        
        updated_count += 1
    
    await db.commit()
    return {"updated": updated_count}


@router.post("/import")
async def import_census_from_excel(
    file: UploadFile = File(...),
    entity: str = Query(...),
    insurance_type: str = Query(...),
    password: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_session),
):
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="File must be an Excel file")
    
    file_password = password or EXCEL_PASSWORD
    
    try:
        content = await file.read()
        file_stream = io.BytesIO(content)
        
        try:
            office_file = msoffcrypto.OfficeFile(file_stream)
            office_file.load_key(password=file_password)
            decrypted = io.BytesIO()
            office_file.decrypt(decrypted)
            decrypted.seek(0)
            df = pd.read_excel(decrypted, engine='openpyxl', header=6, skiprows=[7])
        except Exception:
            file_stream.seek(0)
            df = pd.read_excel(file_stream, engine='openpyxl', header=6, skiprows=[7])
        
        batch_id = f"IMPORT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
        
        records_created = 0
        linked_count = 0
        unlinked_count = 0
        
        emp_result = await db.execute(select(Employee))
        employees = {e.employee_id: e.id for e in emp_result.scalars().all()}
        
        for _, row in df.iterrows():
            record = InsuranceCensusRecord(
                entity=entity,
                insurance_type=insurance_type,
                import_batch_id=batch_id,
                import_filename=file.filename,
                imported_at=datetime.utcnow(),
            )
            
            for excel_col, model_field in COLUMN_MAPPING.items():
                if excel_col in df.columns:
                    val = row.get(excel_col)
                    if pd.notna(val):
                        setattr(record, model_field, str(val).strip())
            
            record.calculate_completeness()
            
            if record.staff_id and record.staff_id in employees:
                record.employee_id = employees[record.staff_id]
                linked_count += 1
            else:
                unlinked_count += 1
            
            db.add(record)
            records_created += 1
        
        import_batch = InsuranceCensusImportBatch(
            batch_id=batch_id,
            filename=file.filename,
            entity=entity,
            insurance_type=insurance_type,
            total_records=records_created,
            linked_records=linked_count,
            unlinked_records=unlinked_count,
        )
        db.add(import_batch)
        
        await db.commit()
        
        return {
            "success": True,
            "batch_id": batch_id,
            "records_created": records_created,
            "linked_to_employees": linked_count,
            "unlinked": unlinked_count,
            "filename": file.filename,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/export/excel")
async def export_census_to_excel(
    db: AsyncSession = Depends(get_session),
    entity: Optional[str] = Query(None),
    insurance_type: Optional[str] = Query(None),
):
    query = select(InsuranceCensusRecord)
    if entity:
        query = query.where(InsuranceCensusRecord.entity == entity)
    if insurance_type:
        query = query.where(InsuranceCensusRecord.insurance_type == insurance_type)
    
    result = await db.execute(query)
    records = result.scalars().all()
    
    data = []
    for r in records:
        data.append({
            'SR NO.': r.sr_no,
            'FIRST NAME': r.first_name,
            'SECOND NAME': r.second_name,
            'FAMILY NAME': r.family_name,
            'FULL NAME': r.full_name,
            'DOB': r.dob,
            'GENDER': r.gender,
            'MARITAL STATUS': r.marital_status,
            'MATERNITY COVERAGE': r.maternity_coverage,
            'RELATION': r.relation,
            'STAFF ID': r.staff_id,
            'EMPLOYEE CARD NUMBER': r.employee_card_number,
            'CATEGORY': r.category,
            'SUB-GROUP NAME': r.sub_group_name,
            'BILLING ENTITY': r.billing_entity,
            'DEPARTMENT': r.department,
            'NATIONALITY': r.nationality,
            'EFFECTIVE DATE': r.effective_date,
            'EMIRATES ID NUMBER': r.emirates_id_number,
            'EMIRATES ID APP NO': r.emirates_id_application_number,
            'BIRTH NOTIFICATION NO': r.birth_notification_no,
            'UID NUMBER': r.uid_number,
            'GDRFA FILE NUMBER': r.gdrfa_file_number,
            'COUNTRY OF RESIDENCY': r.country_of_residency,
            'MEMBER TYPE': r.member_type,
            'OCCUPATION': r.occupation,
            'EMIRATE OF RESIDENCY': r.emirate_of_residency,
            'RESIDENCY LOCATION': r.residency_location,
            'EMIRATE OF WORK': r.emirate_of_work,
            'WORK LOCATION': r.work_location,
            'EMIRATE OF VISA': r.emirate_of_visa,
            'PASSPORT NUMBER': r.passport_number,
            'SALARY': r.salary,
            'MOBILE NO': r.mobile_no,
            'PERSONAL EMAIL': r.personal_email,
            'COMPLETENESS %': r.completeness_pct,
            'MISSING FIELDS': ', '.join(r.missing_fields or []),
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_excel(output, index=False, engine='openpyxl')
    output.seek(0)
    
    from fastapi.responses import StreamingResponse
    filename = f"census_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.delete("/{record_id}")
async def delete_census_record(record_id: int, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(InsuranceCensusRecord).where(InsuranceCensusRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    await db.delete(record)
    await db.commit()
    return {"success": True, "deleted_id": record_id}


@router.get("/batches/list")
async def list_import_batches(db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(InsuranceCensusImportBatch).order_by(InsuranceCensusImportBatch.imported_at.desc())
    )
    batches = result.scalars().all()
    return [
        {
            "id": b.id,
            "batch_id": b.batch_id,
            "filename": b.filename,
            "entity": b.entity,
            "insurance_type": b.insurance_type,
            "total_records": b.total_records,
            "linked_records": b.linked_records,
            "unlinked_records": b.unlinked_records,
            "imported_at": b.imported_at.isoformat() if b.imported_at else None,
        }
        for b in batches
    ]
