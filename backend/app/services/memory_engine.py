from app.db.chroma import get_collection
from app.db.models import Memory as PostgresMemory
from app.db.postgres import SessionLocal
import uuid
from datetime import datetime, timezone

collection = get_collection()

from app.db.models import Workspace as PostgresWorkspace

def get_or_create_workspace(db, name: str, user_id: uuid.UUID):
    slug = name.lower().replace(" ", "-")
    workspace = db.query(PostgresWorkspace).filter(PostgresWorkspace.slug == slug).first()
    if not workspace:
        workspace = PostgresWorkspace(name=name, slug=slug, owner_id=user_id)
        db.add(workspace)
        db.flush() # Get the ID without committing
    return workspace

def store_memory(content, workspace_name, type="note", tags=[], user_id=None, metadata={}):
    memory_id = f"mem_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now(timezone.utc)
    
    db = SessionLocal()
    try:
        # 1. Resolve User (for demo/fallback if not provided)
        if not user_id:
            user = db.query(User).first()
            user_id = user.id if user else uuid.uuid4()

        # 2. Resolve Workspace
        workspace = get_or_create_workspace(db, workspace_name, user_id)
        
        # 3. Vector Persistence (ChromaDB) - Store minimum metadata for search
        collection.add(
            documents=[content],
            metadatas=[{
                "workspace_id": str(workspace.id),
                "user_id": str(user_id),
                "type": type
            }],
            ids=[memory_id]
        )
        
        # 4. Relational Persistence (Supabase) - Store FULL metadata
        new_memory = PostgresMemory(
            id=memory_id,
            content=content,
            type=type,
            user_id=user_id,
            workspace_id=workspace.id,
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
        "workspace": workspace_name,
        "type": type,
        "tags": tags,
        "created_at": timestamp.isoformat()
    }

def query_memories(query, workspace_name, limit=10):
    db = SessionLocal()
    try:
        # Resolve workspace name to ID for the vector search filter
        slug = workspace_name.lower().replace(" ", "-")
        workspace = db.query(PostgresWorkspace).filter(PostgresWorkspace.slug == slug).first()
        
        if not workspace:
            return []

        results = collection.query(
            query_texts=[query],
            where={"workspace_id": str(workspace.id)},
            n_results=limit
        )
        
        memories = []
        if results["ids"] and len(results["ids"][0]) > 0:
            for i in range(len(results["ids"][0])):
                memories.append({
                    "id": results["ids"][0][i],
                    "content": results["documents"][0][i],
                    "workspace": workspace_name,
                    "type": results["metadatas"][0][i]["type"],
                    "tags": [], # Tags are in Supabase now, fetch if needed or skip for search speed
                    "timestamp": results["metadatas"][0][i].get("timestamp"),
                    "score": 1.0 - results["distances"][0][i] if "distances" in results else 0.8
                })
        
        return memories
    finally:
        db.close()

def delete_memory(memory_id, workspace):
    # 1. Vector Deletion
    collection.delete(ids=[memory_id])
    
    # 2. Relational Deletion
    db = SessionLocal()
    try:
        memory = db.query(PostgresMemory).filter(
            PostgresMemory.id == memory_id, 
            PostgresMemory.workspace == workspace
        ).first()
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

def get_workspace_context(workspace_name):
    db = SessionLocal()
    try:
        slug = workspace_name.lower().replace(" ", "-")
        workspace = db.query(PostgresWorkspace).filter(PostgresWorkspace.slug == slug).first()
        
        if not workspace:
            return {"workspace": workspace_name, "total_memories": 0, "top_tags": []}

        total = db.query(PostgresMemory).filter(PostgresMemory.workspace_id == workspace.id).count()
        last_updated = db.query(PostgresMemory).filter(PostgresMemory.workspace_id == workspace.id).order_by(PostgresMemory.created_at.desc()).first()
        
        memories = db.query(PostgresMemory).filter(PostgresMemory.workspace_id == workspace.id).all()
        tag_counts = {}
        for m in memories:
            for tag in m.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        top_tags = sorted([{"tag": k, "count": v} for k, v in tag_counts.items()], key=lambda x: x["count"], reverse=True)[:10]
        
        return {
            "workspace": workspace_name,
            "total_memories": total,
            "last_updated": last_updated.created_at.isoformat() if last_updated else None,
            "top_tags": top_tags,
            "recent_memories": []
        }
    finally:
        db.close()

def analyze_chat_for_identity(history: str):
    # This logic simulates a deep RAG analysis of the conversation history
    tech_keywords = ['react', 'typescript', 'plasmo', 'fastapi', 'chromadb', 'postgres', 'python', 'next.js', 'node']
    found_tech = [t for t in tech_keywords if t in history.lower()]
    
    role = "Software Architect"
    goal = "Developing a cross-platform neural bridge"
    
    if "fintech" in history.lower():
        role = "Senior Fintech Developer"
        goal = "Building a secure B2B financial dashboard"
    elif "extension" in history.lower():
        role = "Extension Specialist"
        goal = "Optimizing cross-browser AI context flows"

    return {
        "role": role,
        "goal": goal,
        "style": "Technical, direct",
        "tech_stack": found_tech if found_tech else ["React", "Python"],
        "analysis_timestamp": datetime.now(timezone.utc).isoformat()
    }

