from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# NOTE: SQLAlchemy models
class CVEChange(Base):
    __tablename__ = "cve_changes"

    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String, index=True)
    event_name = Column(String, index=True)
    source_identifier = Column(String)
    created = Column(DateTime)
    details = Column(JSON, nullable=True)

    class Config:
        orm_mode = True

    def as_dict(self):
        return {
            "id": self.id,
            "cve_id": self.cve_id,
            "event_name": self.event_name,
            "source_identifier": self.source_identifier,
            "created": self.created.isoformat() if isinstance(self.created, datetime) else None,
            "details": self.details,
        }

class User(Base):
    __tablename__ = "nvd_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    verified = Column(Boolean, default=False)

# NOTE: Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str

class ErrorResponse(BaseModel):
    error: str
