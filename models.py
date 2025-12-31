import os
from contextlib import contextmanager
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get('DATABASE_URL')

engine = None
SessionLocal = None
Base = declarative_base()

if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        print(f"Database connection error: {e}")
        engine = None
        SessionLocal = None

class AuditTrail(Base):
    __tablename__ = 'audit_trail'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String(50))
    staff_number = Column(String(50))
    member_number = Column(String(50))
    field = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    user_type = Column(String(20), default='employee')

class ChangeRequest(Base):
    __tablename__ = 'change_requests'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    staff_number = Column(String(50))
    member_number = Column(String(50))
    member_name = Column(String(200))
    field = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    remarks = Column(Text)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(30), default='pending_approval')
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)

class ReminderQueue(Base):
    __tablename__ = 'reminder_queue'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    staff_number = Column(String(50))
    email = Column(String(200))
    employee_name = Column(String(200))
    scheduled_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    status = Column(String(30), default='pending')

def init_db():
    if engine:
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:
            print(f"Error creating tables: {e}")

@contextmanager
def get_db_session():
    """Context manager for database sessions. Use with 'with' statement."""
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def get_db():
    """Legacy function for backward compatibility. Consider using get_db_session() context manager instead.

    Note: Caller is responsible for closing the returned session.
    """
    if SessionLocal:
        return SessionLocal()
    return None
