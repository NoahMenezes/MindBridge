from sqlalchemy import Column, String, JSON, DateTime, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.postgres import Base
from datetime import datetime, timezone

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
    source_url = Column(String, nullable=True)
    extension_version = Column(String, nullable=True)
    
    # Metadata
    summary = Column(String, nullable=True)
    tags = Column(JSON, default=[])
    metadata_json = Column(JSON, default={})
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Identity(Base):
    __tablename__ = "identity_profiles"
    id = Column(Integer, primary_key=True, index=True)
    workspace = Column(String, index=True)
    role = Column(String)
    goal = Column(String)
    tech_stack = Column(JSON)
    style = Column(String)
    analysis_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class RawChatData(Base):
    __tablename__ = "raw_chat_data"
    id = Column(Integer, primary_key=True, index=True)
    workspace = Column(String, index=True)
    source = Column(String) 
    raw_content = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class StructuredChatData(Base):
    __tablename__ = "structured_chat_data"
    id = Column(Integer, primary_key=True, index=True)
    workspace = Column(String, index=True)
    messages = Column(JSON) # Stores the list of structured message objects
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
