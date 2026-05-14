from app.db.chroma import get_collection
from app.db.postgres import SessionLocal
from app.db.models import Identity
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

def analyze_chat_for_identity(history: str, workspace: str = "Personal"):
    """
    Uses LLM to perform deep RAG analysis of the conversation history.
    Saves the result to Postgres and returns the structured identity.
    """
    
    structured_identity = {
        "role": "Software Architect",
        "goal": "Developing a cross-platform neural bridge",
        "style": "Technical, direct",
        "tech_stack": ["React", "Python"],
        "analysis_timestamp": datetime.now(timezone.utc).isoformat()
    }

    system_prompt = """
    Analyze the following chat history and extract the user's professional identity.
    Return a JSON object with:
    - role: Their likely job title or primary role
    - goal: Their current main objective or project focus
    - style: Their communication style (e.g. "Concise", "Technical", "Creative")
    - tech_stack: List of technologies mentioned
    Format: JSON only.
    """
    
    user_prompt = f"Chat History:\n{history}"
    
    response_text = call_llm(user_prompt, system_prompt)
    llm_data = extract_json(response_text)
    
    if llm_data:
        structured_identity.update(llm_data)

    # Save to Postgres with error handling
    try:
        db = SessionLocal()
        try:
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
            db.refresh(new_identity)
        except Exception as e:
            print(f"Postgres Save Error: {e}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        print(f"Database Connection Error: {e}")
    
    return structured_identity
