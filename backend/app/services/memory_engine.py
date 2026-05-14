from app.db.chroma import get_collection
from app.db.postgres import SessionLocal
from app.db.models import User, Workspace as PostgresWorkspace, Memory as PostgresMemory, Identity, RawChatData, StructuredChatData
from app.utils.llm import call_llm, extract_json
import uuid
from datetime import datetime, timezone

collection = get_collection()

def get_or_create_workspace(db, name: str, user_id: uuid.UUID):
    slug = name.lower().replace(" ", "-")
    workspace = db.query(PostgresWorkspace).filter(PostgresWorkspace.slug == slug).first()
    if not workspace:
        workspace = PostgresWorkspace(name=name, slug=slug, owner_id=user_id)
        db.add(workspace)
        db.flush()
    return workspace

def store_memory(content, workspace, type="note", tags=[], user_id=None, metadata={}):
    memory_id = f"mem_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now(timezone.utc)
    
    db = SessionLocal()
    try:
        if not user_id:
            user = db.query(User).first()
            user_id = user.id if user else uuid.uuid4()

        workspace_obj = get_or_create_workspace(db, workspace, user_id)
        
        collection.add(
            documents=[content],
            metadatas=[{
                "workspace_id": str(workspace_obj.id),
                "user_id": str(user_id),
                "type": type
            }],
            ids=[memory_id]
        )
        
        new_memory = PostgresMemory(
            id=memory_id,
            content=content,
            type=type,
            user_id=user_id,
            workspace_id=workspace_obj.id,
            tags=tags,
            metadata_json=metadata,
            source_url=metadata.get("source_url"),
            extension_version=metadata.get("extension_version"),
            created_at=timestamp
        )
        db.add(new_memory)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Supabase Persistence Error: {e}")
        raise e
    finally:
        db.close()
    
    return {
        "id": memory_id,
        "workspace": workspace,
        "type": type,
        "tags": tags,
        "created_at": timestamp.isoformat()
    }

def query_memories(query, workspace, limit=10):
    db = SessionLocal()
    try:
        slug = workspace.lower().replace(" ", "-")
        workspace_obj = db.query(PostgresWorkspace).filter(PostgresWorkspace.slug == slug).first()
        
        if not workspace_obj:
            return []

        results = collection.query(
            query_texts=[query],
            where={"workspace_id": str(workspace_obj.id)},
            n_results=limit
        )
        
        memories = []
        if results["ids"] and len(results["ids"][0]) > 0:
            for i in range(len(results["ids"][0])):
                memories.append({
                    "id": results["ids"][0][i],
                    "content": results["documents"][0][i],
                    "workspace": workspace,
                    "type": results["metadatas"][0][i]["type"],
                    "tags": [],
                    "timestamp": results["metadatas"][0][i].get("timestamp"),
                    "score": 1.0 - results["distances"][0][i] if "distances" in results else 0.8
                })
        return memories
    finally:
        db.close()

def delete_memory(memory_id, workspace):
    collection.delete(ids=[memory_id])
    db = SessionLocal()
    try:
        memory = db.query(PostgresMemory).filter(PostgresMemory.id == memory_id).first()
        if memory:
            db.delete(memory)
            db.commit()
            return True
    except Exception as e:
        db.rollback()
        print(f"Postgres Delete Error: {e}")
    finally:
        db.close()
    return False

def get_workspace_context(workspace):
    db = SessionLocal()
    try:
        slug = workspace.lower().replace(" ", "-")
        workspace_obj = db.query(PostgresWorkspace).filter(PostgresWorkspace.slug == slug).first()
        
        if not workspace_obj:
            return {"workspace": workspace, "total_memories": 0, "top_tags": []}

        total = db.query(PostgresMemory).filter(PostgresMemory.workspace_id == workspace_obj.id).count()
        last_updated = db.query(PostgresMemory).filter(PostgresMemory.workspace_id == workspace_obj.id).order_by(PostgresMemory.created_at.desc()).first()
        
        memories = db.query(PostgresMemory).filter(PostgresMemory.workspace_id == workspace_obj.id).all()
        tag_counts = {}
        for m in memories:
            for tag in m.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        top_tags = sorted([{"tag": k, "count": v} for k, v in tag_counts.items()], key=lambda x: x["count"], reverse=True)[:10]
        
        return {
            "workspace": workspace,
            "total_memories": total,
            "last_updated": last_updated.created_at.isoformat() if last_updated else None,
            "top_tags": top_tags,
            "recent_memories": []
        }
    finally:
        db.close()

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
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

def store_structured_chat(messages: list, workspace: str):
    db = SessionLocal()
    try:
        new_structured_chat = StructuredChatData(
            workspace=workspace,
            messages=messages,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_structured_chat)
        db.commit()
        db.refresh(new_structured_chat)
        return {"status": "success", "id": new_structured_chat.id}
    except Exception as e:
        db.rollback()
        print(f"Structured Chat Store Error: {e}")
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
    
    system_prompt = "Analyze the chat history and extract user role, goal, tech stack and style."
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
