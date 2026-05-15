from fastapi import APIRouter, Request, HTTPException
from app.services.slack import test_slack_connection, get_channel_history
from app.services.memory_engine import store_memory
import json

router = APIRouter(prefix="/slack", tags=["slack"])

@router.get("/test")
async def slack_test():
    return test_slack_connection()

@router.get("/sync-url")
async def get_sync_url():
    import os
    team = os.getenv("SLACK_TEAM_ID", "T00000000")
    channel = os.getenv("SLACK_CHANNEL_ID", "C00000000")
    return {"url": f"https://app.slack.com/client/{team}/{channel}"}

@router.post("/events")
async def slack_events(request: Request):
    payload = await request.json()
    
    # Handle Slack Event URL Verification (Challenge)
    if payload.get("type") == "url_verification":
        return {"challenge": payload.get("challenge")}
    
    # Handle actual events (e.g., messages)
    event = payload.get("event", {})
    if event.get("type") == "message" and not event.get("bot_id"):
        content = event.get("text")
        channel = event.get("channel")
        user = event.get("user")
        
        # Store as memory
        store_memory(
            content=f"Slack Message from {user} in {channel}: {content}",
            workspace="Slack",
            type="collaborator",
            tags=["slack", channel]
        )
        
    return {"status": "ok"}

@router.get("/history/{channel_id}")
async def slack_history(channel_id: str):
    messages = get_channel_history(channel_id)
    return {"messages": messages}
