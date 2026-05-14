from sqlalchemy import Column, String, JSON, DateTime, Integer, Text
from app.db.postgres import Base
from datetime import datetime, timezone

class Identity(Base):
    __tablename__ = "identities"

    id = Column(Integer, primary_key=True, index=True)
    workspace = Column(String, index=True)
    role = Column(String)
    goal = Column(String)
    tech_stack = Column(JSON)
    style = Column(String)
    analysis_timestamp = Column(DateTime, default=datetime.now(timezone.utc))

class RawChatData(Base):
    __tablename__ = "raw_chat_data"

    id = Column(Integer, primary_key=True, index=True)
    workspace = Column(String, index=True)
    source = Column(String) 
    raw_content = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
