import uvicorn
import threading
from app.services.slack_socket import start_socket_mode
import warnings
import os


warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

if __name__ == "__main__":
    # Start Slack Socket Mode in a separate thread
    slack_thread = threading.Thread(target=start_socket_mode, daemon=True)
    slack_thread.start()

    print("\n" + "="*50)
    print("STARTING MINDBRIDGE AI BACKEND")
    print("URL: http://localhost:8000")
    print("Neural Memory Engine: ACTIVE")
    print("="*50 + "\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )