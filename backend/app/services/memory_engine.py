from app.db.chroma import get_collection
from app.db.postgres import SessionLocal
from app.db.models import Identity, RawChatData
from app.utils.llm import call_llm, extract_json
import uuid
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

collection = get_collection()

def store_memory(content, workspace, type="note", tags=[]):
    memory_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    
    try:
        collection.add(
            documents=[content],
            metadatas=[{
                "workspace": workspace,
                "type": type,
                "tags": ",".join(tags),
                "timestamp": timestamp
            }],
            ids=[memory_id]
        )
    except Exception as e:
        print(f"ChromaDB Error: {e}")
    
    return {
        "id": memory_id,
        "workspace": workspace,
        "type": type,
        "tags": tags,
        "created_at": timestamp
    }

def query_memories(query, workspace, limit=10):
    try:
        results = collection.query(
            query_texts=[query],
            where={"workspace": workspace},
            n_results=limit
        )
        
        memories = []
        if results["ids"] and len(results["ids"][0]) > 0:
            for i in range(len(results["ids"][0])):
                memories.append({
                    "id": results["ids"][0][i],
                    "content": results["documents"][0][i],
                    "workspace": results["metadatas"][0][i]["workspace"],
                    "type": results["metadatas"][0][i]["type"],
                    "tags": results["metadatas"][0][i]["tags"].split(","),
                    "timestamp": results["metadatas"][0][i]["timestamp"],
                    "score": 1.0 - results["distances"][0][i] if "distances" in results else 0.8
                })
        return memories
    except Exception as e:
        print(f"ChromaDB Query Error: {e}")
        return []

def store_raw_chat(raw_content: str, workspace: str, source: str):
    
    db = SessionLocal()
    try:
        new_raw_chat = RawChatData(
            workspace=workspace,
            source=source,
            raw_content=raw_content,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_raw_chat)
        db.commit()
        db.refresh(new_raw_chat)
        return {"status": "success", "id": new_raw_chat.id}
    except Exception as e:
        print(f"Postgres Store Raw Error: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

def get_recent_raw_chats(workspace: str, limit: int = 5):
    
    db = SessionLocal()
    try:
        chats = db.query(RawChatData).filter(RawChatData.workspace == workspace).order_by(RawChatData.created_at.desc()).limit(limit).all()
        return [{
            "id": c.id,
            "source": c.source,
            "snippet": c.raw_content[:150] + "...",
            "created_at": c.created_at.isoformat()
        } for c in chats]
    except Exception as e:
        print(f"Postgres Fetch Error: {e}")
        return []
    finally:
        db.close()

def analyze_chat_for_identity(history: str, workspace: str = "Personal"):
    
    
    
    relevant_memories = query_memories(history[:500], workspace, limit=2)
    context = "\n".join([m['content'] for m in relevant_memories])
    
    
    structured_identity = {
        "role": "User",
        "goal": "Collaborating with AI",
        "style": "Professional",
        "tech_stack": [],
        "analysis_timestamp": datetime.now(timezone.utc).isoformat()
    }

    
    system_prompt = f
    
    response_text = call_llm(history, system_prompt)
    llm_data = extract_json(response_text)
    
    if llm_data:
        structured_identity.update(llm_data)

    try:
        db = SessionLocal()
        new_identity = Identity(
            workspace=workspace,
            role=structured_identity["role"],
            goal=structured_identity["goal"],
            tech_stack=structured_identity["tech_stack"],
            style=structured_identity["style"],
            analysis_timestamp=datetime.now(timezone.utc)
        )
        db.add(new_identity)
        db.commit()
        db.close()
    except Exception as e:
        print(f"Postgres Save Error: {e}")
    
    return structured_identity
