import os
from notion_client import Client
from dotenv import load_dotenv

load_dotenv()

NOTION_TOKEN = os.getenv("NOTION_CLIENT_SECRET")
client = Client(auth=NOTION_TOKEN) if NOTION_TOKEN else None

def export_to_notion(title: str, content: str, database_id: str = None):
    
    if not client:
        return {"status": "error", "message": "Notion not configured"}
    
    try:
        
        
        if database_id:
            client.pages.create(
                parent={"database_id": database_id},
                properties={
                    "Name": {"title": [{"text": {"content": title}}]},
                    "Status": {"select": {"name": "Synced"}},
                },
                children=[
                    {
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [{"type": "text", "text": {"content": content}}]
                        },
                    }
                ],
            )
        else:
            
            return {"status": "error", "message": "Database ID required for Notion export"}
            
        return {"status": "success", "message": "Exported to Notion"}
    except Exception as e:
        print(f"Notion Export Error: {e}")
        return {"status": "error", "message": str(e)}
