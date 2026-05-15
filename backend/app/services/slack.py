import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from dotenv import load_dotenv

load_dotenv()

SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
client = WebClient(token=SLACK_BOT_TOKEN) if SLACK_BOT_TOKEN else None

def test_slack_connection():
    if not client:
        return {"status": "error", "message": "Slack Bot Token not configured"}
    
    try:
        response = client.auth_test()
        return {
            "status": "success", 
            "bot_user": response["user"],
            "team": response["team"]
        }
    except SlackApiError as e:
        return {"status": "error", "message": str(e)}

def get_channel_history(channel_id, limit=10):
    if not client:
        return []
    
    try:
        response = client.conversations_history(channel=channel_id, limit=limit)
        return response["messages"]
    except SlackApiError as e:
        print(f"Slack History Error: {e}")
        return []

def post_message(channel_id, text):
    if not client:
        return None
    
    try:
        response = client.chat_postMessage(channel=channel_id, text=text)
        return response
    except SlackApiError as e:
        print(f"Slack Post Error: {e}")
        return None
