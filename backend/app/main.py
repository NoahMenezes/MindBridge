
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid

from app.db.postgres import engine
from app.db import models


try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create Postgres tables: {e}")

from fastapi.middleware.cors import CORSMiddleware
from app.routes import memory

app = FastAPI()
app.include_router(memory.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

from app.schemas import (
    AddMemoryRequest,
    SearchMemoriesRequest,
    GetWorkspaceContextRequest,
    DeleteMemoryRequest,
    ExtractIdentityRequest,
    StoreRawChatRequest,
    DetectIdentityRequest
)

from app.services.memory_engine import (
    store_memory, 
    search_relevant_memories, 
    analyze_chat_for_identity, 
    store_raw_chat, 
    store_structured_chat,
    store_identity_profile,
    get_recent_raw_chats,
    get_workspace_context as fetch_workspace_context,
    delete_memory as remove_memory
)

from app.services.llm_extractor import extract_identity_from_chats


@app.get("/")
async def root():
    return {"status": "ok", "message": "MindBridge AI Memory Engine Running"}

@app.post("/detect_identity")
async def detect_identity_endpoint(request: DetectIdentityRequest):
    print(f"\n[DETECT_IDENTITY] Received payload from workspace: {request.workspace}")
    
    # 1. Prepare raw content for unstructured storage
    raw_content = "\n\n".join([f"{m.role.upper()}: {m.content}" for m in request.messages])
    
    # 2. Store raw chat data (unstructured)
    raw_result = store_raw_chat(
        raw_content=raw_content,
        workspace=request.workspace,
        source=request.workspace.upper()
    )
    if raw_result["status"] == "error":
        print(f"[ERROR] Raw Chat Store failed: {raw_result['message']}")
        raise HTTPException(status_code=500, detail=f"Raw storage failed: {raw_result['message']}")
    
    # 3. Store structured data (JSON)
    db_result = store_structured_chat(
        messages=[m.dict() for m in request.messages], 
        workspace=request.workspace
    )
    if db_result["status"] == "error":
        print(f"[ERROR] Structured Chat Store failed: {db_result['message']}")
        raise HTTPException(status_code=500, detail=f"Structured storage failed: {db_result['message']}")
    
    # 4. Extract Identity Traits using llama3.2 via Ollama
    identity_traits = extract_identity_from_chats([m.dict() for m in request.messages])
    
    # 5. Store Identity Profile in Supabase
    identity_result = store_identity_profile(identity_traits, request.workspace)
    
    return {
        "status": "success",
        "message": "Identity detected, profiled, and stored successfully.",
        "identity": identity_traits,
        "identity_id": identity_result.get("id"),
        "count": len(request.messages),
        "workspace": request.workspace,
        "raw_id": raw_result.get("id"),
        "db_id": db_result.get("id")
    }

@app.post("/add_memory", status_code=201)
async def add_memory(request: AddMemoryRequest):
    result = store_memory(
        content=request.content,
        workspace=request.workspace,
        type=request.type,
        tags=request.tags
    )
    return {
        **result,
        "message": "Memory successfully stored in ChromaDB.",
        "version": "1.0"
    }

@app.post("/search_memories")
async def search_memories(request: SearchMemoriesRequest):
    memories = search_relevant_memories(
        query=request.query,
        workspace=request.workspace,
        limit=request.limit
    )
    return {
        "memories": memories,
        "count": len(memories),
        "query": request.query,
        "workspace": request.workspace,
        "version": "1.0"
    }

@app.post("/store_raw_chat")
async def store_chat(request: StoreRawChatRequest):
    result = store_raw_chat(request.raw_content, request.workspace, request.source)
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return {
        **result,
        "message": "Raw chat history successfully stored in Supabase.",
        "version": "1.0"
    }

@app.get("/recent_chats")
async def recent_chats(workspace: str = "Personal"):
    chats = get_recent_raw_chats(workspace)
    return {"chats": chats}

@app.post("/extract_identity")
async def extract_identity(request: ExtractIdentityRequest):
    identity = analyze_chat_for_identity(request.history, request.workspace)
    
    
    store_memory(
        content=f"Detected Identity: {identity['role']} working on {identity['goal']}",
        workspace=request.workspace,
        type="context",
        tags=["auto-extracted", "identity"]
    )
    
    return {
        "identity": identity,
        "message": "Identity analyzed and structured by MindBridge Backend using RAG context.",
        "version": "1.0"
    }

@app.post("/get_workspace_context")
async def get_workspace_context_route(request: GetWorkspaceContextRequest):
    context = fetch_workspace_context(request.workspace)
    return {
        "context": context,
        "version": "1.0"
    }

@app.post("/delete_memory")
async def delete_memory_route(request: DeleteMemoryRequest):
    success = remove_memory(request.id, request.workspace)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found.")
    return {
        "id": request.id,
        "workspace": request.workspace,
        "deleted_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "message": "Memory deleted successfully.",
        "version": "1.0"
    }
