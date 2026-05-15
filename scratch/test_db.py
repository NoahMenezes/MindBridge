import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

load_dotenv("backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

print(f"Testing connection to: {DATABASE_URL.split('@')[-1] if DATABASE_URL else 'None'}")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';"))
        tables = [row[0] for row in result]
        print("\nFound tables in 'public' schema:")
        for table in tables:
            print(f" - {table}")
        
        if not tables:
            print("Warning: No tables found in public schema!")
            
except Exception as e:
    print(f"\nDatabase Connection Failed: {e}")
