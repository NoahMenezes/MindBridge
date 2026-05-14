import os
import json
import re
import google.generativeai as genai
from openai import OpenAI
import ollama
from dotenv import load_dotenv

load_dotenv()

# Config
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

# Initialize clients
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)

def call_llm(prompt: str, system_prompt: str = "You are a helpful assistant."):
    """
    Unified entry point for LLM calls based on provider in .env
    """
    if LLM_PROVIDER == "gemini" and GEMINI_API_KEY:
        return _call_gemini(prompt, system_prompt)
    elif LLM_PROVIDER == "openai" and OPENAI_API_KEY:
        return _call_openai(prompt, system_prompt)
    elif LLM_PROVIDER == "ollama":
        return _call_ollama(prompt, system_prompt)
    else:
        # Fallback or error
        return "Error: No valid LLM provider configured."

def _call_gemini(prompt, system_prompt):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_prompt)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini Error: {e}"

def _call_openai(prompt, system_prompt):
    try:
        response = openai_client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"OpenAI Error: {e}"

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
        return f"Ollama Error: {e}"

def extract_json(text):
    """
    Helper to extract JSON from LLM response text
    """
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return None
    return None
