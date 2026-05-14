import os
import json
import re

import google.generativeai as genai
import ollama
from dotenv import load_dotenv


env_path = os.path.join(os.path.dirname(__file__), "../../../.env")
load_dotenv(env_path)
load_dotenv() 



LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def call_llm(prompt: str, system_prompt: str = "You are a helpful assistant."):
    
    if LLM_PROVIDER == "gemini" and GEMINI_API_KEY:
        return _call_gemini(prompt, system_prompt)
    elif LLM_PROVIDER == "ollama":
        return _call_ollama(prompt, system_prompt)
    else:
        
        if LLM_PROVIDER == "gemini":
            print("Gemini API Key missing, falling back to local Ollama...")
            return _call_ollama(prompt, system_prompt)
        return "Error: No valid LLM provider configured."

def _call_gemini(prompt, system_prompt):
    try:
        
        model = genai.GenerativeModel('gemini-3-flash-preview')
        response = model.generate_content([system_prompt, prompt])
        return response.text
    except Exception as e:
        return f"Gemini Error: {e}"

def _call_ollama(prompt, system_prompt):
    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        return response['message']['content']
    except Exception as e:
        return f"Ollama Error: {e}. Make sure 'ollama serve' is running if using local provider."

def extract_json(text):
    
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return None
    return None
