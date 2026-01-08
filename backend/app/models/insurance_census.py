from sqlalchemy import Column, Integer, String, Date, DateTime, Text, Boolean, Numeric, Enum, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.models.renewal import Base
import enum

class EntityType(str, enum.Enum):
    WATERGENERATION = "watergeneration"
    AGRICULTURE = "agriculture"

class InsuranceType(str, enum.Enum):
    EXPATS = "expats"
    THIQA = "thiqa"

class RelationType(str, enum.Enum):
    EMPLOYEE = "employee"
    SPOUSE = "spouse"
    CHILD = "child"
    PARENT = "parent"
    OTHER = "other"

class RenewalStatus(str, enum.Enum):
    EXISTING = "existing"
    ADDITION = "addition"
    DELETION = "deletion"

# DHA/DOH Validation Required Fields
# These are mandatory for UAE-based policy validation
DHA_DOH_VALIDATION_FIELDS = [
    'passport_number',       # Passport-No
    'gdrfa_file_number',     # Visa File No
    'emirates_id_number',    # EID No
    'uid_number',            # UID No
    'nationality',           # Nationality
    'dob',                   # DOB
    'gender',                # Gender
]

MANDATORY_FIELDS = [
    'full_name',
    'dob',
    'gender',
    'relation',
    'staff_id',
    'category',
    'effective_date',
    'nationality',
    'uid_number',
]

MANDATORY_FIELDS_FOR_RENEWAL = [
    'emirates_id_number',
    'gdrfa_file_number',
    'passport_number',
]

# Fields that are tracked for amendments (purple highlighting)
AMENDMENT_TRACKED_FIELDS = [
    'full_name',
    'first_name',
    'second_name',
    'family_name',
    'marital_status',
    'passport_number',
    'gdrfa_file_number',
    'emirates_id_number',
    'nationality',
    'dob',
    'gender',
]

class InsuranceCensusRecord(Base):
    __tablename__ = "insurance_census_records"

    id = Column(Integer, primary_key=True, index=True)
    
    entity = Column(String(50), nullable=False)
    insurance_type = Column(String(20), nullable=False)
    
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    
    sr_no = Column(String(20), nullable=True)
    first_name = Column(String(100), nullable=True)
    second_name = Column(String(100), nullable=True)
    family_name = Column(String(100), nullable=True)
    full_name = Column(String(255), nullable=True)
    dob = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    marital_status = Column(String(50), nullable=True)
    maternity_coverage = Column(String(20), nullable=True)
    relation = Column(String(50), nullable=True)
    staff_id = Column(String(50), nullable=True, index=True)
    employee_card_number = Column(String(50), nullable=True)
    category = Column(String(255), nullable=True)
    sub_group_name = Column(String(255), nullable=True)
    billing_entity = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    nationality = Column(String(100), nullable=True)
    effective_date = Column(String(50), nullable=True)
    emirates_id_number = Column(String(50), nullable=True)
    emirates_id_application_number = Column(String(100), nullable=True)
    emirates_id_processing_note = Column(Text, nullable=True)
    birth_notification_no = Column(String(100), nullable=True)
    uid_number = Column(String(50), nullable=True)
    gdrfa_file_number = Column(String(100), nullable=True)
    country_of_residency = Column(String(100), nullable=True)
    member_type = Column(String(50), nullable=True)
    occupation = Column(String(100), nullable=True)
    emirate_of_residency = Column(String(50), nullable=True)
    residency_location = Column(String(100), nullable=True)
    emirate_of_work = Column(String(50), nullable=True)
    work_location = Column(String(100), nullable=True)
    emirate_of_visa = Column(String(50), nullable=True)
    passport_number = Column(String(50), nullable=True)
    salary = Column(String(50), nullable=True)
    commission = Column(String(50), nullable=True)
    establishment_type = Column(String(100), nullable=True)
    entity_id = Column(String(50), nullable=True)
    company_phone = Column(String(50), nullable=True)
    company_email = Column(String(100), nullable=True)
    landline_no = Column(String(50), nullable=True)
    mobile_no = Column(String(50), nullable=True)
    personal_email = Column(String(100), nullable=True)
    vip = Column(String(20), nullable=True)
    height = Column(String(20), nullable=True)
    weight = Column(String(20), nullable=True)
    
    missing_fields = Column(JSON, nullable=True, default=list)
    completeness_pct = Column(Integer, nullable=True, default=0)
    
    # DHA/DOH Validation fields tracking
    dha_doh_missing_fields = Column(JSON, nullable=True, default=list)
    dha_doh_valid = Column(Boolean, nullable=True, default=False)
    
    # Renewal status tracking
    # 'existing' = existing member, 'addition' = new member to add, 'deletion' = member to remove
    renewal_status = Column(String(20), nullable=True, default='existing')
    renewal_effective_date = Column(String(50), nullable=True)  # e.g., "15-01-2025"
    
    # Amendment tracking - stores list of field names that were amended
    amended_fields = Column(JSON, nullable=True, default=list)
    
    import_batch_id = Column(String(50), nullable=True)
    import_filename = Column(String(255), nullable=True)
    imported_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by = Column(String(50), nullable=True)

    employee = relationship("Employee", foreign_keys=[employee_id], backref="insurance_census_records")

    def calculate_completeness(self):
        """Calculate completeness percentage and also check DHA/DOH validation."""
        all_mandatory = MANDATORY_FIELDS + MANDATORY_FIELDS_FOR_RENEWAL
        missing = []
        for field in all_mandatory:
            val = getattr(self, field, None)
            if not val or (isinstance(val, str) and not val.strip()):
                missing.append(field)
        
        self.missing_fields = missing
        total = len(all_mandatory)
        filled = total - len(missing)
        self.completeness_pct = int((filled / total) * 100) if total > 0 else 0
        
        # Also calculate DHA/DOH validation status
        self.calculate_dha_doh_validation()
        
        return self.missing_fields
    
    def calculate_dha_doh_validation(self):
        """
        Check DHA/DOH validation requirements for UAE-based policy.
        Required fields: Passport-No, Visa File No, EID No, UDI No, Nationality, DOB, Gender
        If any are incorrect/pending, validation fails and member will be excluded from renewal.
        """
        dha_missing = []
        for field in DHA_DOH_VALIDATION_FIELDS:
            val = getattr(self, field, None)
            if not val or (isinstance(val, str) and not val.strip()):
                dha_missing.append(field)
        
        self.dha_doh_missing_fields = dha_missing
        self.dha_doh_valid = len(dha_missing) == 0
        return self.dha_doh_valid
    
    def mark_field_as_amended(self, field_name: str):
        """Mark a field as amended for purple highlighting."""
        if field_name in AMENDMENT_TRACKED_FIELDS:
            if not self.amended_fields:
                self.amended_fields = []
            if field_name not in self.amended_fields:
                self.amended_fields = self.amended_fields + [field_name]

    def to_dict(self):
        return {
            'id': self.id,
            'entity': self.entity,
            'insurance_type': self.insurance_type,
            'employee_id': self.employee_id,
            'sr_no': self.sr_no,
            'first_name': self.first_name,
            'second_name': self.second_name,
            'family_name': self.family_name,
            'full_name': self.full_name,
            'dob': self.dob,
            'gender': self.gender,
            'marital_status': self.marital_status,
            'maternity_coverage': self.maternity_coverage,
            'relation': self.relation,
            'staff_id': self.staff_id,
            'employee_card_number': self.employee_card_number,
            'category': self.category,
            'sub_group_name': self.sub_group_name,
            'billing_entity': self.billing_entity,
            'department': self.department,
            'nationality': self.nationality,
            'effective_date': self.effective_date,
            'emirates_id_number': self.emirates_id_number,
            'emirates_id_application_number': self.emirates_id_application_number,
            'emirates_id_processing_note': self.emirates_id_processing_note,
            'birth_notification_no': self.birth_notification_no,
            'uid_number': self.uid_number,
            'gdrfa_file_number': self.gdrfa_file_number,
            'country_of_residency': self.country_of_residency,
            'member_type': self.member_type,
            'occupation': self.occupation,
            'emirate_of_residency': self.emirate_of_residency,
            'residency_location': self.residency_location,
            'emirate_of_work': self.emirate_of_work,
            'work_location': self.work_location,
            'emirate_of_visa': self.emirate_of_visa,
            'passport_number': self.passport_number,
            'salary': self.salary,
            'commission': self.commission,
            'establishment_type': self.establishment_type,
            'entity_id': self.entity_id,
            'company_phone': self.company_phone,
            'company_email': self.company_email,
            'landline_no': self.landline_no,
            'mobile_no': self.mobile_no,
            'personal_email': self.personal_email,
            'vip': self.vip,
            'height': self.height,
            'weight': self.weight,
            'missing_fields': self.missing_fields or [],
            'completeness_pct': self.completeness_pct or 0,
            'dha_doh_missing_fields': self.dha_doh_missing_fields or [],
            'dha_doh_valid': self.dha_doh_valid or False,
            'renewal_status': self.renewal_status or 'existing',
            'renewal_effective_date': self.renewal_effective_date,
            'amended_fields': self.amended_fields or [],
            'import_batch_id': self.import_batch_id,
            'import_filename': self.import_filename,
            'imported_at': self.imported_at.isoformat() if self.imported_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'updated_by': self.updated_by,
        }


class InsuranceCensusImportBatch(Base):
    __tablename__ = "insurance_census_import_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(50), unique=True, index=True, nullable=False)
    filename = Column(String(255), nullable=False)
    entity = Column(String(50), nullable=False)
    insurance_type = Column(String(20), nullable=False)
    total_records = Column(Integer, default=0)
    linked_records = Column(Integer, default=0)
    unlinked_records = Column(Integer, default=0)
    imported_by = Column(String(50), nullable=True)
    imported_at = Column(DateTime, server_default=func.now())
    notes = Column(Text, nullable=True)
