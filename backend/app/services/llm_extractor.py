import httpx
import json
import os
import re
from typing import List, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

# Ensure env is loaded
env_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(env_path)
load_dotenv()

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3.2:latest")

def extract_identity_from_chats(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Sends structured chat history to Ollama (llama3.2) to extract identity traits.
    """
    
    # --- PHASE 1: PREPARE PAYLOAD ---
    chat_text = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
    
    prompt = f"""
    Analyze the following structured conversation and extract a compact identity profile of the USER.
    
    CONVERSATION:
    {chat_text}
    
    EXTRACTION RULES:
    1. Extract ONLY: name, profession, interests, projects, goals, skills, technologies, communication style, recurring themes.
    2. If a trait is not found, use an empty list [] or null.
    3. Remove duplicates and keep traits extremely compact (1-3 words each).
    4. Ignore temporary chatter or generic statements.
    5. RETURN ONLY VALID JSON. No preamble, no markdown formatting.
    
    JSON SCHEMA:
    {{
      "name": "string or null",
      "profession": "string or null",
      "interests": ["string"],
      "projects": ["string"],
      "goals": ["string"],
      "skills": ["string"],
      "technologies": ["string"],
      "communication_style": "string or null",
      "recurring_themes": ["string"]
    }}
    """
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    print(f"\n[OLLAMA] Sending payload to {MODEL_NAME}...")
    print(f"[OLLAMA] Prompt Snippet: {prompt[:100]}...")

    try:
        # --- PHASE 2: CALL OLLAMA ---
        with httpx.Client(timeout=30.0) as client:
            response = client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            
            raw_response = response.json().get("response", "")
            print(f"[OLLAMA] Raw Response: {raw_response[:200]}...")
            
            # --- PHASE 3: CLEAN & PARSE JSON ---
            clean_json = _clean_json_response(raw_response)
            
            if clean_json:
                print(f"[OLLAMA] Successfully parsed identity for: {clean_json.get('name') or 'Unknown'}")
                return clean_json
            else:
                print("[ERROR] Failed to parse JSON from Ollama response.")
                return _get_empty_identity()

    except httpx.ConnectError:
        print("[ERROR] Ollama is offline. Ensure 'ollama serve' is running.")
        return _get_empty_identity("Ollama Offline")
    except Exception as e:
        print(f"[ERROR] Extraction failed: {str(e)}")
        return _get_empty_identity(str(e))

def _clean_json_response(text: str) -> Dict[str, Any]:
    """
    Handles markdown wrappers and finds the first JSON object in the text.
    """
    try:
        # Remove markdown code blocks if present
        text = re.sub(r'```json\n?|\n?```', '', text).strip()
        
        # Find first { and last }
        start = text.find('{')
        end = text.rfind('}')
        
        if start != -1 and end != -1:
            json_str = text[start:end+1]
            return json.loads(json_str)
        return None
    except Exception as e:
        print(f"JSON Cleaning Error: {e}")
        return None

def _get_empty_identity(error: str = None) -> Dict[str, Any]:
    return {
        "name": None,
        "profession": None,
        "interests": [],
        "projects": [],
        "goals": [],
        "skills": [],
        "technologies": [],
        "communication_style": None,
        "recurring_themes": [],
        "error": error
    }
