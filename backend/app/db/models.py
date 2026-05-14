from sqlalchemy import Column, String, JSON, DateTime, Integer
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
