from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.db.postgres import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Memory(Base):
    __tablename__ = "memories"
    
    id = Column(String, primary_key=True) # mem_... format
    content = Column(String, nullable=False)
    type = Column(String, nullable=False) # note, project, snippet, etc.
    
    # Ownership & Context
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    
    # Extension Linking
    source_url = Column(String, nullable=True) # URL where the memory was captured
    extension_version = Column(String, nullable=True)
    
    # Metadata
    summary = Column(String, nullable=True)
    tags = Column(JSON, default=[])
    metadata_json = Column(JSON, default={}) # Flexible extra metadata
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
