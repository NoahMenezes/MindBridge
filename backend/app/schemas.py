from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Annotated
from datetime import datetime


MEMORY_CONTENT_MIN = 1
MEMORY_CONTENT_MAX = 100000 
MEMORY_SUMMARY_MIN = 1
MEMORY_SUMMARY_MAX = 500
TAG_MIN_LENGTH = 1
TAG_MAX_LENGTH = 64
TAGS_MAX_COUNT = 20
WORKSPACE_MIN = 1
WORKSPACE_MAX = 256
QUERY_MIN = 1
QUERY_MAX = 500
SEARCH_LIMIT_MIN = 1
SEARCH_LIMIT_MAX = 50
SEARCH_LIMIT_DEFAULT = 10
SCORE_MIN = 0.0
SCORE_MAX = 1.0
SCORE_MIN_DEFAULT = 0.5
RECENT_MEMORIES_MAX = 5
TOP_TAGS_MAX = 10


MemoryType = Literal["project", "preference", "goal", "collaborator", "note", "context"]


WorkspaceId = Annotated[str, Field(min_length=WORKSPACE_MIN, max_length=WORKSPACE_MAX)]
TagType = Annotated[str, Field(min_length=TAG_MIN_LENGTH, max_length=TAG_MAX_LENGTH)]


class MemoryResult(BaseModel):
    id: str = Field(..., min_length=1)
    workspace: WorkspaceId
    type: MemoryType
    summary: Annotated[str, Field(min_length=MEMORY_SUMMARY_MIN, max_length=MEMORY_SUMMARY_MAX)]
    content: Annotated[str, Field(min_length=MEMORY_CONTENT_MIN, max_length=MEMORY_CONTENT_MAX)]
    score: float = Field(..., ge=SCORE_MIN, le=SCORE_MAX)
    tags: List[TagType] = Field(default=[], max_length=TAGS_MAX_COUNT)
    timestamp: str

class TagFrequency(BaseModel):
    tag: str = Field(..., min_length=1)
    count: int = Field(..., ge=0)

class WorkspaceContext(BaseModel):
    workspace: WorkspaceId
    total_memories: int = Field(..., ge=0)
    last_updated: Optional[str]
    recent_memories: List[MemoryResult] = Field(..., max_length=RECENT_MEMORIES_MAX)
    top_tags: List[TagFrequency] = Field(..., max_length=TOP_TAGS_MAX)



class AddMemoryRequest(BaseModel):
    content: str = Field(..., min_length=MEMORY_CONTENT_MIN, max_length=MEMORY_CONTENT_MAX)
    workspace: WorkspaceId
    type: MemoryType = "note"
    tags: List[TagType] = Field(default=[], max_length=TAGS_MAX_COUNT)

class AddMemoryResponse(BaseModel):
    id: str
    workspace: WorkspaceId
    type: MemoryType
    tags: List[TagType]
    created_at: str
    message: str
    version: str

class SearchMemoriesRequest(BaseModel):
    query: str = Field(..., min_length=QUERY_MIN, max_length=QUERY_MAX)
    workspace: WorkspaceId
    limit: int = Field(default=SEARCH_LIMIT_DEFAULT, ge=SEARCH_LIMIT_MIN, le=SEARCH_LIMIT_MAX)
    min_score: float = Field(default=SCORE_MIN_DEFAULT, ge=SCORE_MIN, le=SCORE_MAX)

class SearchMemoriesResponse(BaseModel):
    memories: List[MemoryResult]
    count: int = Field(..., ge=0)
    query: str
    workspace: WorkspaceId
    version: str

class GetWorkspaceContextRequest(BaseModel):
    workspace: WorkspaceId

class GetWorkspaceContextResponse(BaseModel):
    context: WorkspaceContext
    version: str

class ExtractIdentityRequest(BaseModel):
    history: str = Field(..., min_length=1)
    workspace: WorkspaceId

class ExtractIdentityResponse(BaseModel):
    identity: dict
    message: str
    version: str

class DeleteMemoryRequest(BaseModel):
    id: str = Field(..., min_length=1)
    workspace: WorkspaceId

class DeleteMemoryResponse(BaseModel):
    id: str
    workspace: WorkspaceId
    deleted_at: str
    message: str
    version: str

class StoreRawChatRequest(BaseModel):
    raw_content: str = Field(..., min_length=1)
    workspace: WorkspaceId
    source: str = "Unknown"

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    workspace: Optional[str] = None
    timestamp: Optional[int] = None

class DetectIdentityRequest(BaseModel):
    messages: List[ChatMessage]
    workspace: WorkspaceId = "default"
