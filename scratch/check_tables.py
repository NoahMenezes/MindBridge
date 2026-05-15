import os
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

tables = ["memories", "identity_profiles", "raw_chat_data", "structured_chat_data", "workspaces"]

print(f"Checking Supabase REST API: {SUPABASE_URL}")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

for table in tables:
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=count"
    try:
        resp = httpx.get(url, headers=headers)
        if resp.status_code == 200:
            print(f"OK: Table '{table}' exists.")
        elif resp.status_code == 404:
            print(f"FAIL: Table '{table}' NOT FOUND (404).")
        else:
            print(f"WARN: Table '{table}' returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"ERROR: Connection error for '{table}': {e}")
