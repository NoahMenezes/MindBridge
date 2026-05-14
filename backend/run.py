import uvicorn
import warnings
import os
import sys

# Force UTF-8 output on Windows to avoid emoji encoding errors
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

if __name__ == "__main__":
    print("\n" + "="*50)
    print("[*] MINDBRIDGE AI BACKEND STARTING")
    print("[*] URL: http://localhost:8000")
    print("[*] Neural Memory Engine: ACTIVE")
    print("="*50 + "\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )