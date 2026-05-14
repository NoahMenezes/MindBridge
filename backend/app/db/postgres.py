import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

env_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(env_path)
load_dotenv() 

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/mindbridge")

# --- Programmatic Fixes for Supabase Connectivity ---
if "rvvmlaqbrqivxbfigsmf" in DATABASE_URL:
    # 1. Fix unencoded '&' in password
    DATABASE_URL = DATABASE_URL.replace("Erika&Sneha4", "Erika%26Sneha4")
    
    # 2. Fix IPv6 reachability by switching to IPv4-enabled Pooler (Mumbai region)
    if "db.rvvmlaqbrqivxbfigsmf.supabase.co" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("db.rvvmlaqbrqivxbfigsmf.supabase.co", "aws-0-ap-south-1.pooler.supabase.com")
        DATABASE_URL = DATABASE_URL.replace(":5432/", ":6543/")
        
        # 3. Add project ref to username (required by Supabase pooler)
        if "postgres.rvvmlaqbrqivxbfigsmf" not in DATABASE_URL:
            DATABASE_URL = DATABASE_URL.replace("postgres:", "postgres.rvvmlaqbrqivxbfigsmf:")
            
        # 4. Ensure SSL mode for pooler
        if "sslmode" not in DATABASE_URL:
            DATABASE_URL += "&sslmode=require" if "?" in DATABASE_URL else "?sslmode=require"

print(f"[DB] Using optimized database host: {DATABASE_URL.split('@')[-1].split(':')[0]}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
