# Attendance Module - Enhanced with UAE Labor Law Compliance

## Overview

The Attendance Module has been enhanced to fully integrate with Employee Master data and comply with UAE Labor Law (Federal Decree-Law No. 33/2021). This document outlines the improvements, employee work settings integration, and compliance features.

## Employee Work Settings Integration

The attendance module is now linked to the following Employee Master fields:

### 1. Working Days (`employee.work_schedule`)
- **5 days**: Standard 40-hour work week (8 hours/day, Mon-Fri)
- **6 days**: Standard 48-hour work week (8 hours/day Mon-Thu, 4 hours Friday)

### 2. Work Location (`employee.location`)
- **Head Office**: Abu Dhabi headquarters
- **Kezad**: Khalifa Industrial Zone
- **Safario**: Remote manufacturing site
- **Sites**: Various project locations
- **Client Site**: Customer premises (work type override)
- **Remote**: WFH or other remote locations

### 3. Extra Hours Policy (`employee.overtime_type`)
| Policy | Description | Example Employees |
|--------|-------------|-------------------|
| **N/A** | Not eligible for overtime | Directors, Executives |
| **Offset** | Overtime converted to time off | Officers, Coordinators |
| **Paid** | Overtime paid at premium rate | Skilled/Non-Skilled Labor |

## UAE Labor Law Compliance

### Federal Decree-Law No. 33/2021 - Key Provisions

#### Article 17: Working Hours
- Maximum **8 hours** regular work per day
- Maximum **48 hours** per week
- System enforces these limits and flags violations

#### Article 18: Ramadan Hours
- **2 hours reduction** per day during Ramadan
- System supports Ramadan mode (6 hours/day instead of 8)

#### Article 19: Overtime
- Maximum **2 hours overtime** per day
- Overtime rate: **125%** for regular hours
- Overtime rate: **150%** for night work (9 PM - 4 AM) or holidays
- System caps overtime at legal limit automatically

#### Article 21: Weekly Rest
- Minimum **1 day rest** per week
- Friday is the standard rest day
- 6-day workers: Friday is a half-day (4 hours)

## New Features

### 1. Work Location Tracking
```python
# Clock-in now captures work location
{
    "work_type": "office",
    "work_location": "Kezad",  # From employee master or override
    "latitude": 24.4539,
    "longitude": 54.3773
}
```

### 2. Manual Entry/Correction Workflow
- HR/Admin can create manual attendance entries
- Employees can request corrections to their records
- All corrections require HR approval
- Full audit trail maintained

### 3. Offset Hours Tracking
For employees with `overtime_type = "Offset"`:
- Overtime hours are tracked as offset balance
- Can be used for time-off later
- Separate field: `offset_hours_earned`

### 4. UAE Compliance Flags
Each attendance record now includes:
- `is_ramadan_hours`: Was this a Ramadan working day?
- `is_rest_day`: Is this employee's designated rest day?
- `exceeds_daily_limit`: Did hours exceed 8 + 2 = 10 hours?
- `exceeds_overtime_limit`: Did overtime exceed 2 hours?

### 5. Enhanced Dashboard
Dashboard now shows:
- Location breakdown (Head Office, Kezad, Sites)
- Pending correction approvals
- UAE compliance alerts (employees exceeding limits)
- Work type breakdown (client site, business travel)

## API Endpoints

### New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/attendance/employee-work-settings/{id}` | GET | Get employee's work settings |
| `/attendance/manual-entry` | POST | Create manual attendance entry (HR) |
| `/attendance/{id}/request-correction` | POST | Request attendance correction |
| `/attendance/{id}/approve-correction` | POST | Approve/reject correction (HR) |

### Enhanced Endpoints

| Endpoint | Enhancement |
|----------|-------------|
| `/attendance/today` | Includes employee work schedule and overtime policy |
| `/attendance/clock-in` | Captures work_location from employee master |
| `/attendance/clock-out` | Uses employee-specific hours for calculations |
| `/attendance/records` | New filters: work_location, pending_corrections, exceeds_limits |
| `/attendance/dashboard` | Location breakdown and compliance alerts |

## Work Type Constants

```python
WORK_TYPES = [
    "office",           # At designated office location
    "wfh",              # Work from home
    "field",            # Field work
    "client_site",      # At customer premises
    "business_travel",  # Traveling for business
    "leave",            # On approved leave
    "holiday"           # Public holiday
]
```

## Standard Timing (UAE)

| Setting | Value | Notes |
|---------|-------|-------|
| Standard Clock In | 8:00 AM | UAE time |
| Standard Clock Out | 5:00 PM | 8 hours + 1 hour break |
| Grace Period | 15 minutes | Late after 8:15 AM |
| Ramadan Clock Out | 3:00 PM | 6 hours + 1 hour break |
| Friday Clock Out | 12:00 PM | Half-day for 6-day workers |

## Database Schema Changes

### New Columns in `attendance_records`

| Column | Type | Description |
|--------|------|-------------|
| `work_location` | VARCHAR(100) | Work location captured at clock-in |
| `offset_hours_earned` | NUMERIC(5,2) | Offset hours for this day |
| `offset_day_reference` | VARCHAR(100) | Reference for offset usage |
| `is_ramadan_hours` | BOOLEAN | Ramadan working day flag |
| `is_rest_day` | BOOLEAN | Rest day flag |
| `exceeds_daily_limit` | BOOLEAN | Exceeded 10 hours flag |
| `exceeds_overtime_limit` | BOOLEAN | Exceeded 2 hours OT flag |
| `is_manual_entry` | BOOLEAN | Manual entry flag |
| `manual_entry_reason` | TEXT | Reason for manual entry |
| `manual_entry_by` | INTEGER (FK) | Who created manual entry |
| `manual_entry_at` | TIMESTAMP | When manual entry created |
| `correction_approved` | BOOLEAN | Correction approval status |
| `correction_approved_by` | INTEGER (FK) | Who approved correction |
| `correction_approved_at` | TIMESTAMP | When correction approved |

## Migration

Run migration `20260109_0019_enhance_attendance_uae_compliance.py`:

```bash
cd backend
alembic upgrade head
```

## Example: Hours Calculation

For an employee with:
- `work_schedule`: "6 days"
- `overtime_type`: "Offset"
- Clock in: 8:00 AM
- Clock out: 7:30 PM (11.5 hours worked)

Calculation:
1. Standard hours for Monday: 8 hours
2. Total worked: 11.5 hours (after 1 hour break deducted)
3. Regular hours: 8 hours
4. Overtime: 3.5 hours → **CAPPED at 2 hours** (UAE law limit)
5. Offset hours earned: 2 hours
6. `exceeds_overtime_limit`: TRUE (flagged for review)

## Compliance Reporting

### Weekly Check
System tracks:
- Total hours per week per employee
- Flags if > 48 hours
- Ensures at least 1 rest day per week

### Dashboard Alerts
HR dashboard shows:
- Employees exceeding daily limits today
- Employees exceeding overtime limits today
- Pending corrections requiring approval

## Future Enhancements

1. **Ramadan Mode Toggle**: System setting to activate Ramadan hours globally
2. **Offset Balance Dashboard**: Track cumulative offset hours per employee
3. **Weekly Compliance Report**: Automated weekly UAE compliance report
4. **Holiday Integration**: Automatic holiday detection for overtime rates
5. **Night Work Detection**: Track night work (9 PM - 4 AM) for 150% rate

---

*Last Updated: January 9, 2026*
*Version: 2.0 - UAE Labor Law Compliant*
