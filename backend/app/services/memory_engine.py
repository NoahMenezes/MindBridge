from app.db.chroma import get_collection
import uuid
from datetime import datetime, timezone

collection = get_collection()

def store_memory(content, workspace, type="note", tags=[]):
    memory_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    
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
    
    return {
        "id": memory_id,
        "workspace": workspace,
        "type": type,
        "tags": tags,
        "created_at": timestamp
    }

def query_memories(query, workspace, limit=10):
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
def analyze_chat_for_identity(history: str):
    # This logic simulates a deep RAG analysis of the conversation history
    # In production, this would use an LLM with a specific system prompt
    
    tech_keywords = ['react', 'typescript', 'plasmo', 'fastapi', 'chromadb', 'postgres', 'python', 'next.js', 'node']
    found_tech = [t for t in tech_keywords if t in history.lower()]
    
    # Analyze the history to extract a likely role and goal
    # We look for "building", "creating", "working on" etc.
    role = "Software Architect"
    goal = "Developing a cross-platform neural bridge"
    
    if "fintech" in history.lower():
        role = "Senior Fintech Developer"
        goal = "Building a secure B2B financial dashboard"
    elif "extension" in history.lower():
        role = "Extension Specialist"
        goal = "Optimizing cross-browser AI context flows"

    structured_identity = {
        "role": role,
        "goal": goal,
        "style": "Technical, direct",
        "tech_stack": found_tech if found_tech else ["React", "Python"],
        "analysis_timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    return structured_identity
