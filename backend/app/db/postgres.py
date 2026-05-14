from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv


env_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(env_path)
load_dotenv() 

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/mindbridge")
print(f"[DB] Using database host: {DATABASE_URL.split('@')[-1].split(':')[0]}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
