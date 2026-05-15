import os
import uuid
import httpx
from datetime import datetime, timezone
from app.db.chroma import get_collection
from app.utils.llm import call_llm, extract_json

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

collection = get_collection()

# ----------------------------
# 1. CHAT CONTEXT PARSER
# ----------------------------

def generate_chat_context(query_text: str):
    """
    Architectural Step 1: Generate a structured semantic representation of the chat.
    This is transient and NOT stored in the database.
    """
    prompt = f"""
Analyze the following chat and extract its semantic core for vector search.
Return ONLY a valid JSON object with these EXACT keys:
- intent: (what the user is trying to do)
- topics: (key subjects discussed as a comma-separated string)
- entities: (people, tools, systems, projects mentioned)
- actions: (requests, commands, or goals identified)
- compressed_summary: (1-3 sentence meaning of the interaction)

CHAT CONTENT:
{query_text}
"""
    try:
        response = call_llm(prompt)
        context = extract_json(response)
        if context:
            # Ensure all required keys exist
            for key in ["intent", "topics", "entities", "actions", "compressed_summary"]:
                if key not in context: context[key] = "none"
            return context
    except Exception as e:
        print(f"[CONTEXT_PARSER_ERROR] {e}")
    
    return {
        "intent": "general inquiry",
        "topics": "unknown",
        "entities": "none",
        "actions": "none",
        "compressed_summary": query_text[:200]
    }

# ----------------------------
# 2. SEMANTIC RETRIEVAL ENGINE
# ----------------------------

def search_relevant_memories(query: str, workspace: str = "Personal", limit: int = 10):
    """
    Architectural Steps 2 & 3: Context-aware semantic retrieval using vector search.
    Includes a Cloud-to-Local sync check.
    """
    try:
        print(f"\n[CHROMA_SYNC] Starting semantic retrieval in workspace: {workspace}")

        # 0. Cloud-to-Local Sync Check (Ensure Chroma has data if Supabase does)
        try:
            local_count = collection.count() # This is global count, but we can check if it's 0
            if local_count == 0:
                print(f"[CHROMA_SYNC] Local store empty. Synchronizing from Supabase...")
                sync_workspace_from_cloud(workspace)
        except:
            pass

        # 1. Handle Empty Input (Use last memory as seed context)
        source_text = query
        if not source_text or not source_text.strip():
            print("[CHROMA_SYNC] Input empty. Using last stored memory as context seed.")
            last_mem = collection.get(limit=1, include=["documents"])
            if last_mem.get("documents"):
                source_text = last_mem["documents"][0]
            else:
                return get_recency_fallback(workspace, limit)

        # 1. Generate Structured Context (Transient)
        ctx = generate_chat_context(source_text)

        # 2. Build Embedding Input (Mandatory Spec)
        # compressed_summary + intent + topics + entities
        embedding_input = (
            f"{ctx.get('compressed_summary', '')} "
            f"{ctx.get('intent', '')} "
            f"{ctx.get('topics', '')} "
            f"{ctx.get('entities', '')}"
        ).strip()
        
        print(f"[CHROMA_SYNC] Querying Chroma with context: {embedding_input[:100]}...")

        # 3. Vector Similarity Search (Top-K = limit)
        # Results are ranked by vector distance, NOT by time.
        results = collection.query(
            query_texts=[embedding_input],
            where={"workspace": workspace},
            n_results=limit
        )

        memories = parse_chroma_results(results)

        # 4. Fallback Logic (ONLY for failure or very low relevance)
        if not memories or (len(memories) > 0 and memories[0].get("score", 0) < 0.2):
            print("[CHROMA_SYNC] Low semantic relevance. Fetching recent logs as fallback.")
            memories = get_recency_fallback(workspace, limit)

        return memories[:limit]

    except Exception as e:
        print(f"[CHROMA_SYNC_ERROR] {e}")
        return []

def parse_chroma_results(results):
    memories = []
    if results.get("ids") and results["ids"][0]:
        for i in range(len(results["ids"][0])):
            content = results["documents"][0][i]
            dist = results["distances"][0][i] if "distances" in results else 0.5
            # Score conversion
            score = max(0.0, 1.0 - dist)
            meta = results["metadatas"][0][i]
            
            memories.append({
                "id": results["ids"][0][i],
                "summary": content[:200] + ("..." if len(content) > 200 else ""),
                "content": content,
                "workspace": meta.get("workspace", "Global"),
                "type": meta.get("type", "memory"),
                "timestamp": meta.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "score": score
            })
    return memories

def get_recency_fallback(workspace, limit):
    """
    Architectural Step 4: Fallback to most recent logs.
    """
    # Fetch from current workspace
    res = collection.get(where={"workspace": workspace}, limit=limit, include=["documents", "metadatas"])
    
    # If empty, fetch from any workspace
    if not res.get("ids"):
        res = collection.get(limit=limit, include=["documents", "metadatas"])

    memories = []
    if res.get("ids"):
        # Local sort by timestamp DESC
        items = []
        for i in range(len(res["ids"])):
            items.append({
                "id": res["ids"][i],
                "content": res["documents"][i],
                "metadata": res["metadatas"][i]
            })
        
        items.sort(key=lambda x: x["metadata"].get("timestamp", ""), reverse=True)

        for item in items:
            content = item["content"]
            meta = item["metadata"]
            memories.append({
                "id": item["id"],
                "summary": content[:200] + "...",
                "content": content,
                "workspace": meta.get("workspace", "System"),
                "timestamp": meta.get("timestamp"),
                "score": 0.0,
                "is_fallback": True
            })
    return memories

def sync_workspace_from_cloud(workspace: str):
    """
    Fetches all memories for a workspace from Supabase and populates ChromaDB.
    Ensures local vector store is in sync with cloud persistence.
    """
    try:
        url = f"{SUPABASE_URL}/rest/v1/memories"
        params = {"workspace": f"eq.{workspace}", "select": "*"}
        
        with httpx.Client() as client:
            resp = client.get(url, headers=HEADERS, params=params)
            if resp.status_code == 200:
                memories = resp.json()
                if not memories: return
                
                documents = [m["content"] for m in memories]
                metadatas = [{"workspace": m["workspace"], "type": m["type"], "timestamp": m["created_at"]} for m in memories]
                ids = [m["id"] for m in memories]
                
                collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                print(f"[CLOUD_SYNC] Successfully hydrated {len(memories)} items from Supabase to ChromaDB.")
    except Exception as e:
        print(f"[CLOUD_SYNC_ERROR] {e}")

# ----------------------------
# 3. UNIFIED STORAGE (SYNC)
# ----------------------------

def store_memory(content, workspace, type="note", tags=None, metadata=None):
    memory_id = f"mem_{uuid.uuid4().hex[:8]}"
    ts = datetime.now(timezone.utc).isoformat()
    
    try:
        # 1. Local Chroma
        collection.add(
            documents=[content],
            metadatas=[{"workspace": workspace, "type": type, "timestamp": ts}],
            ids=[memory_id]
        )
        
        # 2. Remote Supabase REST
        payload = {
            "id": memory_id,
            "content": content,
            "type": type,
            "workspace": workspace,
            "tags": tags or [],
            "metadata_json": metadata or {},
            "created_at": ts
        }
        with httpx.Client() as client:
            client.post(f"{SUPABASE_URL}/rest/v1/memories", headers=HEADERS, json=payload)
            
        return {"status": "success", "id": memory_id}
    except Exception as e:
        print(f"[STORE_ERROR] {e}")
        return {"status": "error", "message": str(e)}

def store_raw_chat(raw_content: str, workspace: str, source: str):
    memory_id = f"raw_{uuid.uuid4().hex[:8]}"
    ts = datetime.now(timezone.utc).isoformat()
    try:
        collection.add(
            documents=[raw_content[:4000]], # Truncate for embedding
            metadatas=[{"workspace": workspace, "type": "raw_chat", "timestamp": ts}],
            ids=[memory_id]
        )
        payload = {"workspace": workspace, "source": source, "raw_content": raw_content, "created_at": ts}
        with httpx.Client() as client:
            client.post(f"{SUPABASE_URL}/rest/v1/raw_chat_data", headers=HEADERS, json=payload)
        return {"status": "success", "id": memory_id}
    except Exception as e:
        print(f"[RAW_STORE_ERROR] {e}")
        return {"status": "error", "message": str(e)}

def store_structured_chat(messages: list, workspace: str):
    memory_id = f"struct_{uuid.uuid4().hex[:8]}"
    ts = datetime.now(timezone.utc).isoformat()
    content = "\n".join([f"{m.get('role','user')}: {m.get('content','')}" for m in messages])
    try:
        collection.add(
            documents=[content[:4000]], # Truncate for embedding
            metadatas=[{"workspace": workspace, "type": "structured_chat", "timestamp": ts}],
            ids=[memory_id]
        )
        payload = {"workspace": workspace, "messages": messages, "created_at": ts}
        with httpx.Client() as client:
            client.post(f"{SUPABASE_URL}/rest/v1/structured_chat_data", headers=HEADERS, json=payload)
        return {"status": "success", "id": memory_id}
    except Exception as e:
        print(f"[STRUCT_STORE_ERROR] {e}")
        return {"status": "error", "message": str(e)}

# ----------------------------
# 4. ADDITIONAL HELPERS
# ----------------------------

def get_recent_raw_chats(workspace: str, limit: int = 5):
    try:
        params = {"workspace": f"eq.{workspace}", "order": "created_at.desc", "limit": limit}
        with httpx.Client() as client:
            resp = client.get(f"{SUPABASE_URL}/rest/v1/raw_chat_data", headers=HEADERS, params=params)
            return resp.json() if resp.status_code == 200 else []
    except:
        return []

def store_identity_profile(traits: dict, workspace: str):
    try:
        payload = {
            "workspace": workspace,
            "name": traits.get("name"),
            "profession": traits.get("profession"),
            "interests": traits.get("interests", []),
            "goals": traits.get("goals", []),
            "skills": traits.get("skills", []),
            "technologies": traits.get("technologies", []),
            "communication_style": traits.get("communication_style"),
            "recurring_themes": traits.get("recurring_themes", []),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        with httpx.Client() as client:
            client.post(f"{SUPABASE_URL}/rest/v1/identity_profiles", headers=HEADERS, json=payload)
        return {"status": "success"}
    except:
        return {"status": "error"}

def analyze_chat_for_identity(history: str, workspace: str = "Personal"):
    # Semantic retrieval for identity context
    relevant = search_relevant_memories(history[:500], workspace, limit=2)
    context = "\n".join([m['summary'] for m in relevant])
    
    prompt = f"Analyze user persona from chat: {history}\nHistorical context: {context}"
    data = extract_json(call_llm(prompt)) or {}
    
    profile = {
        "role": data.get("role", "User"),
        "goal": data.get("goal", "Collaboration"),
        "style": data.get("style", "Professional")
    }
    profile.update(data)
    store_identity_profile(profile, workspace)
    return profile

def delete_memory(memory_id, workspace):
    try:
        collection.delete(ids=[memory_id])
        params = {"id": f"eq.{memory_id}"}
        with httpx.Client() as client:
            client.delete(f"{SUPABASE_URL}/rest/v1/memories", headers=HEADERS, params=params)
        return True
    except:
        return False

def get_workspace_context(workspace):
    try:
        url = f"{SUPABASE_URL}/rest/v1/memories"
        params = {"workspace": f"eq.{workspace}", "select": "count", "Prefer": "count=exact"}
        with httpx.Client() as client:
            resp = client.get(url, headers=HEADERS, params=params)
            total = int(resp.headers.get("Content-Range", "0-0/0").split("/")[-1])
            return {"workspace": workspace, "total_memories": total}
    except:
        return {"workspace": workspace, "total_memories": 0}
