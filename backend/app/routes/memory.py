from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services.memory_engine import search_relevant_memories

router = APIRouter()

class GetRelevantMemoriesRequest(BaseModel):
    query: str
    workspace: str = "Personal"

@router.post("/get_relevant_memories")
async def get_relevant_memories(request: GetRelevantMemoriesRequest):
    memories = search_relevant_memories(request.query, request.workspace, limit=5)
    return {
        "status": "success",
        "memories": memories
    }
