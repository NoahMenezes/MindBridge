import os
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler
from app.services.memory_engine import store_memory
from dotenv import load_dotenv

load_dotenv()

SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
SLACK_APP_TOKEN = os.getenv("SLACK_APP_TOKEN")

app = App(token=SLACK_BOT_TOKEN)

@app.event("message")
def handle_message_events(body, logger):
    event = body.get("event", {})
    if event.get("type") == "message" and not event.get("bot_id"):
        content = event.get("text")
        channel = event.get("channel")
        user = event.get("user")
        
        print(f"[SLACK_SOCKET] Received message from {user} in {channel}")
        
        # Store as memory via REST
        store_memory(
            content=f"Slack Message from {user} in {channel}: {content}",
            workspace="Slack",
            type="collaborator",
            tags=["slack", channel]
        )

def start_socket_mode():
    if not SLACK_APP_TOKEN:
        print("[SLACK_SOCKET] Error: SLACK_APP_TOKEN not found in .env. Socket Mode disabled.")
        return
    
    handler = SocketModeHandler(app, SLACK_APP_TOKEN)
    print("[SLACK_SOCKET] Starting Slack Socket Mode handler...")
    handler.start()

if __name__ == "__main__":
    start_socket_mode()
