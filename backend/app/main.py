from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid

app = FastAPI()

# --- Global Error Handlers ---
def format_error(status_code: int, code: str, message: str, details: dict = None):
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or {}
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return format_error(
        status_code=400,
        code="INVALID_REQUEST",
        message="Validation failed / Malformed JSON.",
        details={"errors": exc.errors()}
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code = "UNKNOWN_ERROR"
    message = exc.detail
    
    # Customize the global errors specified in the requirements
    if exc.status_code == 400:
        code = "INVALID_REQUEST"
        message = "Validation failed / Malformed JSON."
    elif exc.status_code == 401:
        code = "AUTH_FAILED"
        message = "Unauthorized (JWT missing/invalid)."
    elif exc.status_code == 404:
        code = "NOT_FOUND"
        message = "Memory or Workspace not found."
    elif exc.status_code == 500:
        code = "INTERNAL_ERROR"
        message = "DB/Vector store failure."

    return format_error(
        status_code=exc.status_code,
        code=code,
        message=message
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return format_error(
        status_code=500,
        code="INTERNAL_ERROR",
        message="DB/Vector store failure."
    )

# --- Pydantic Models ---
class AddMemoryRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    workspace: str = Field(..., min_length=1, max_length=256)
    type: Literal["project", "preference", "goal", "collaborator", "note", "context"]
    tags: Optional[List[str]] = Field(default=[], max_length=20)

class SearchMemoriesRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    workspace: str
    limit: Optional[int] = Field(default=10, ge=1, le=50)
    min_score: Optional[float] = Field(default=0.5, ge=0.0, le=1.0)

class GetWorkspaceContextRequest(BaseModel):
    workspace: str

class DeleteMemoryRequest(BaseModel):
    id: str
    workspace: str

# --- Endpoints ---
@app.get("/")
async def root():
    return {"status": "ok", "message": "MindBridge API Running"}

@app.post("/add_memory", status_code=201)
async def add_memory(request: AddMemoryRequest):
    return {
        "id": str(uuid.uuid4()),
        "workspace": request.workspace,
        "type": request.type,
        "tags": request.tags or [],
        "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z", # ISO-8601
        "message": "Memory stored successfully.",
        "version": "1.0"
    }

@app.post("/search_memories")
async def search_memories(request: SearchMemoriesRequest):
    return {
        "memories": [
            {
                "id": str(uuid.uuid4()),
                "workspace": request.workspace,
                "type": "project",
                "summary": "Auto-generated summary",
                "content": "Example content matching query",
                "score": 0.95,
                "tags": ["example"],
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
            }
        ],
        "count": 1,
        "query": request.query,
        "workspace": request.workspace,
        "version": "1.0"
    }

@app.post("/get_workspace_context")
async def get_workspace_context(request: GetWorkspaceContextRequest):
    return {
        "context": {
            "workspace": request.workspace,
            "total_memories": 42,
            "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "recent_memories": [], 
            "top_tags": [
                { "tag": "auth", "count": 12 }
            ]
        },
        "version": "1.0"
    }

@app.post("/delete_memory")
async def delete_memory(request: DeleteMemoryRequest):
    return {
        "id": request.id,
        "workspace": request.workspace,
        "deleted_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "message": "Memory deleted successfully.",
        "version": "1.0"
    }
