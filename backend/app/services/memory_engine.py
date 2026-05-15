import os
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

def generate_chat_context(query_text: str):
    """
    Architectural Step 1: Chat Context Parser.
    Generates a structured semantic representation of the chat without storing it.
    """
    prompt = f"""
    Analyze the following chat context and extract its structured semantic meaning for vector retrieval.
    Return ONLY a JSON object with these keys:
    - intent: what the user is trying to do
    - topics: comma-separated list of key subjects
    - entities: people, tools, systems, projects mentioned
    - actions: requests, commands, or goals identified
    - compressed_summary: 1-2 sentence meaning of the interaction

    CHAT CONTEXT:
    {query_text}
    """
    try:
        response = call_llm(prompt)
        context = extract_json(response)
        if context:
            return context
    except Exception as e:
        print(f"[CONTEXT_PARSER_ERROR] {e}")
    
    # Minimal fallback structure
    return {
        "intent": "general inquiry",
        "topics": "unknown",
        "entities": "none",
        "actions": "none",
        "compressed_summary": query_text[:200]
    }

def store_memory(content, workspace, type="note", tags=[], user_id=None, metadata={}):
    memory_id = f"mem_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now(timezone.utc).isoformat()
    
    try:
        # 1. Store in ChromaDB (Local Semantic Search)
        collection.add(
            documents=[content],
            metadatas=[{
                "workspace": workspace,
                "type": type,
                "timestamp": timestamp
            }],
            ids=[memory_id]
        )
        
        # 2. Store in Supabase via REST (Persistent Storage)
        url = f"{SUPABASE_URL}/rest/v1/memories"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        payload = {
            "id": memory_id,
            "content": content,
            "type": type,
            "workspace": workspace,
            "tags": tags,
            "metadata_json": metadata,
            "created_at": timestamp
        }
        
        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=payload)
            if response.status_code >= 400:
                print(f"Supabase REST Error (Memory): {response.text}")
                return {"status": "error", "message": response.text}
                
        return {
            "id": memory_id,
            "workspace": workspace,
            "type": type,
            "tags": tags,
            "created_at": timestamp,
            "status": "success"
        }
    except Exception as e:
        print(f"Store Memory Exception: {e}")
        return {"status": "error", "message": str(e)}

def query_memories(query, workspace, limit=10):
    try:
        slug = workspace.lower().replace(" ", "-")
        url = f"{SUPABASE_URL}/rest/v1/workspaces?slug=eq.{slug}&select=id"
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        
        workspace_id = None
        with httpx.Client() as client:
            resp = client.get(url, headers=headers)
            if resp.status_code == 200 and len(resp.json()) > 0:
                workspace_id = resp.json()[0]["id"]
                
        if not workspace_id:
            return []

        results = collection.query(
            query_texts=[query],
            where={"workspace_id": str(workspace_id)},
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
    except Exception as e:
        print(f"Query Memories Error: {e}")
        return []

def search_relevant_memories(query: str, workspace: str = "Personal", limit: int = 10):
    try:
        print(f"\n[CHROMA_DEBUG] Initiating Context-Aware Search in workspace: {workspace}")
        
        # 1. Resolve Workspace ID via REST
        slug = workspace.lower().replace(" ", "-")
        ws_url = f"{SUPABASE_URL}/rest/v1/workspaces?slug=eq.{slug}&select=id"
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        
        workspace_id = None
        try:
            with httpx.Client() as client:
                resp = client.get(ws_url, headers=headers, timeout=5.0)
                if resp.status_code == 200 and len(resp.json()) > 0:
                    workspace_id = resp.json()[0]["id"]
        except Exception as ws_err:
            print(f"[CHROMA_DEBUG] Workspace resolution failed: {ws_err}")

        where_filter = {"workspace_id": str(workspace_id)} if workspace_id else None
        
        # 2. Handle Empty Chat Input
        search_query = query
        if not search_query or not search_query.strip():
            print("[CHROMA_DEBUG] Empty chat detected. Retrieving last stored memory for context.")
            last_mem = collection.get(limit=1, include=["documents"])
            if last_mem["documents"]:
                search_query = last_mem["documents"][0]
            else:
                return []

        # 3. Generate Structured Semantic Context
        print("[CHROMA_DEBUG] Generating semantic context via LLM...")
        ctx = generate_chat_context(search_query)
        embedding_input = f"{ctx.get('compressed_summary', '')} {ctx.get('intent', '')} {ctx.get('topics', '')} {ctx.get('entities', '')}"
        print(f"[CHROMA_DEBUG] Embedding Input: {embedding_input[:100]}...")

        # 4. Semantic Search
        results = collection.query(
            query_texts=[embedding_input],
            where=where_filter,
            n_results=limit
        )

        memories = []
        if results["ids"] and len(results["ids"][0]) > 0:
            for i in range(len(results["ids"][0])):
                content = results["documents"][0][i]
                summary = content[:150] + "..." if len(content) > 150 else content
                
                dist = results["distances"][0][i] if "distances" in results else 0.5
                score = max(0.0, 1.0 - min(dist, 1.0))

                # Threshold Filter
                if score < 0.1: # Lowered threshold for better sensitivity
                    continue

                memories.append({
                    "id": results["ids"][0][i],
                    "summary": summary,
                    "workspace": workspace,
                    "type": results["metadatas"][0][i].get("type", "memory"),
                    "timestamp": results["metadatas"][0][i].get("timestamp", datetime.now(timezone.utc).isoformat()),
                    "score": score
                })

        # 5. Global Search Fallback
        if len(memories) == 0:
            if where_filter is not None:
                print("[CHROMA_DEBUG] No matches in workspace. Retrying search GLOBALLY.")
                return search_relevant_memories(query, workspace="Global_Search_Fallback", limit=limit)
            
            print("[CHROMA_DEBUG] No semantic matches found. Triggering final log-dump fallback.")
            fallback_results = collection.get(
                where=where_filter,
                limit=limit,
                include=["documents", "metadatas"]
            )

            if fallback_results["ids"]:
                for i in range(len(fallback_results["ids"])):
                    content = fallback_results["documents"][i]
                    summary = content[:150] + "..." if len(content) > 150 else content
                    memories.append({
                        "id": fallback_results["ids"][i],
                        "summary": summary,
                        "workspace": workspace,
                        "type": fallback_results["metadatas"][i].get("type", "memory"),
                        "timestamp": fallback_results["metadatas"][i].get("timestamp", datetime.now(timezone.utc).isoformat()),
                        "score": 0.0,
                        "is_fallback": True
                    })

                if memories:
                    memories.insert(0, {
                        "id": "fallback-msg",
                        "summary": "Oops! No relevant data found. Meanwhile... choose from this assortment: ",
                        "type": "system",
                        "workspace": workspace,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "is_message": True
                    })

        # 6. Sort and Limit
        memories.sort(key=lambda x: x.get("score", 0), reverse=True)
        return memories[:limit]
    except Exception as e:
        print(f"[CHROMA_DEBUG] Search Memories Error: {e}")
        return []

    except Exception as e:
        print(f"[CHROMA_DEBUG] Search Memories Error: {e}")
        return []

def delete_memory(memory_id, workspace):
    # 1. Delete from ChromaDB
    collection.delete(ids=[memory_id])
    
    # 2. Delete from Supabase via REST
    try:
        url = f"{SUPABASE_URL}/rest/v1/memories"
        params = {"id": f"eq.{memory_id}"}
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        
        with httpx.Client() as client:
            response = client.delete(url, headers=headers, params=params)
            return response.status_code < 400
    except Exception as e:
        print(f"Delete Memory Error: {e}")
        return False

def get_workspace_context(workspace):
    try:
        # Use REST API to get counts and context
        url = f"{SUPABASE_URL}/rest/v1/memories"
        params = {
            "workspace": f"eq.{workspace}",
            "select": "count",
            "Prefer": "count=exact"
        }
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        
        with httpx.Client() as client:
            resp = client.get(url, headers=headers, params=params)
            total = int(resp.headers.get("Content-Range", "0-0/0").split("/")[-1])
            
            # Get last updated
            params_last = {
                "workspace": f"eq.{workspace}",
                "order": "created_at.desc",
                "limit": 1
            }
            resp_last = client.get(url, headers=headers, params=params_last)
            last_mem = resp_last.json()
            last_updated = last_mem[0].get("created_at") if last_mem else None

        return {
            "workspace": workspace,
            "total_memories": total,
            "last_updated": last_updated,
            "top_tags": [], # Simplified for REST migration
            "recent_memories": []
        }
    except Exception as e:
        print(f"Get Workspace Context Error: {e}")
        return {"workspace": workspace, "total_memories": 0, "top_tags": []}

import httpx

# Supabase REST configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def store_raw_chat(raw_content: str, workspace: str, source: str):
    try:
        # 1. Fetch Workspace ID via REST to bypass Postgres issues
        slug = workspace.lower().replace(" ", "-")
        ws_url = f"{SUPABASE_URL}/rest/v1/workspaces?slug=eq.{slug}&select=id"
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        
        workspace_id = "Personal"
        with httpx.Client() as client:
            resp = client.get(ws_url, headers=headers)
            if resp.status_code == 200 and len(resp.json()) > 0:
                workspace_id = resp.json()[0]["id"]

        # 2. Add to ChromaDB for Semantic Search
        memory_id = f"raw_{uuid.uuid4().hex[:8]}"
        collection.add(
            documents=[raw_content],
            metadatas=[{
                "workspace_id": str(workspace_id),
                "type": "raw_chat",
                "source": source,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }],
            ids=[memory_id]
        )

        # 3. Store in Supabase via REST
        url = f"{SUPABASE_URL}/rest/v1/raw_chat_data"
        payload = {
            "workspace": workspace,
            "source": source,
            "raw_content": raw_content,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        with httpx.Client() as client:
            response = client.post(url, headers={**headers, "Content-Type": "application/json", "Prefer": "return=representation"}, json=payload)
            if response.status_code >= 400:
                print(f"Supabase REST Error (Raw): {response.text}")
                return {"status": "error", "message": response.text}
            
            data = response.json()
            return {"status": "success", "id": data[0].get("id") if data else None}
    except Exception as e:
        print(f"Raw Chat Store Exception: {e}")
        return {"status": "error", "message": str(e)}

def store_structured_chat(messages: list, workspace: str):
    try:
        # 1. Fetch Workspace ID via REST
        slug = workspace.lower().replace(" ", "-")
        ws_url = f"{SUPABASE_URL}/rest/v1/workspaces?slug=eq.{slug}&select=id"
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        
        workspace_id = "Personal"
        with httpx.Client() as client:
            resp = client.get(ws_url, headers=headers)
            if resp.status_code == 200 and len(resp.json()) > 0:
                workspace_id = resp.json()[0]["id"]

        # 2. Extract content for ChromaDB
        # We join the messages into a searchable block
        content_block = "\n".join([f"{m.get('role', 'user')}: {m.get('content', '')}" for m in messages])
        
        # 3. Add to ChromaDB
        memory_id = f"struct_{uuid.uuid4().hex[:8]}"
        collection.add(
            documents=[content_block],
            metadatas=[{
                "workspace_id": str(workspace_id),
                "type": "structured_chat",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }],
            ids=[memory_id]
        )

        # 4. Store in Supabase via REST
        url = f"{SUPABASE_URL}/rest/v1/structured_chat_data"
        payload = {
            "workspace": workspace,
            "messages": messages,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        with httpx.Client() as client:
            response = client.post(url, headers={**headers, "Content-Type": "application/json", "Prefer": "return=representation"}, json=payload)
            if response.status_code >= 400:
                print(f"Supabase REST Error (Structured): {response.text}")
                return {"status": "error", "message": response.text}
            
            data = response.json()
            return {"status": "success", "id": data[0].get("id") if data else None}
    except Exception as e:
        print(f"Structured Chat Store Exception: {e}")
        return {"status": "error", "message": str(e)}

def get_recent_raw_chats(workspace: str, limit: int = 5):
    try:
        url = f"{SUPABASE_URL}/rest/v1/raw_chat_data"
        params = {
            "workspace": f"eq.{workspace}",
            "order": "created_at.desc",
            "limit": limit
        }
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        
        with httpx.Client() as client:
            response = client.get(url, headers=headers, params=params)
            if response.status_code >= 400:
                return []
            
            chats = response.json()
            return [{
                "id": c.get("id"),
                "source": c.get("source"),
                "snippet": (c.get("raw_content") or "")[:150] + "...",
                "created_at": c.get("created_at")
            } for c in chats]
    except Exception as e:
        print(f"Get Recent Chats Error: {e}")
        return []

def store_identity_profile(traits: dict, workspace: str):
    try:
        url = f"{SUPABASE_URL}/rest/v1/identity_profiles"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        # Prepare payload matching the new identity_profiles schema
        payload = {
            "workspace": workspace,
            "name": traits.get("name"),
            "profession": traits.get("profession"),
            "interests": traits.get("interests", []),
            "projects": traits.get("projects", []),
            "goals": traits.get("goals", []),
            "skills": traits.get("skills", []),
            "technologies": traits.get("technologies", []),
            "communication_style": traits.get("communication_style"),
            "recurring_themes": traits.get("recurring_themes", []),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=payload)
            if response.status_code >= 400:
                print(f"Supabase REST Error (Identity): {response.text}")
                return {"status": "error", "message": response.text}
            
            data = response.json()
            return {"status": "success", "id": data[0].get("id") if data else None}
    except Exception as e:
        print(f"Identity Profile Store Exception: {e}")
        return {"status": "error", "message": str(e)}

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

    if llm_data:
        structured_identity.update(llm_data)

    # Use the REST-based store function instead of direct Postgres
    store_identity_profile(structured_identity, workspace)
    
    return structured_identity
