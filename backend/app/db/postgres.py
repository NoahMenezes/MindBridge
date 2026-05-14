import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

env_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(env_path)
load_dotenv() 

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/mindbridge")

# --- Database URL Fixes ---
# 1. Fix unencoded '&' in password
if "Erika&Sneha4" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("Erika&Sneha4", "Erika%26Sneha4")

# 2. Fix IPv4 reachability for Supabase (Mumbai region)
# If connecting to the direct host fails (Network unreachable), we switch to the IPv4 pooler.
if "db.rvvmlaqbrqivxbfigsmf.supabase.co" in DATABASE_URL:
    print("[DB] Detected Supabase direct host. Applying IPv4 pooler optimization...")
    DATABASE_URL = DATABASE_URL.replace("db.rvvmlaqbrqivxbfigsmf.supabase.co", "aws-0-ap-south-1.pooler.supabase.com")
    DATABASE_URL = DATABASE_URL.replace(":5432/", ":6543/")
    
    # Ensure project ref is in the username (required by Supabase pooler)
    if "postgres.rvvmlaqbrqivxbfigsmf" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgres:", "postgres.rvvmlaqbrqivxbfigsmf:")
    
    # Ensure SSL mode is required for the pooler
    if "sslmode" not in DATABASE_URL:
        DATABASE_URL += "&sslmode=require" if "?" in DATABASE_URL else "?sslmode=require"

print(f"[DB] Initializing database connection...")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
