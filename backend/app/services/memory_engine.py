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
