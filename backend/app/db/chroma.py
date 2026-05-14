
import chromadb

from chromadb.utils import embedding_functions
import os
import google.generativeai as genai
from dotenv import load_dotenv


env_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(env_path)
load_dotenv() 

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_store")
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "gemini").lower()
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

class CustomGoogleEmbeddingFunction(embedding_functions.EmbeddingFunction):
    
    def __init__(self, api_key, model_name):
        self.model_name = model_name
        genai.configure(api_key=api_key)

    def __call__(self, input):
        try:
            response = genai.embed_content(
                model=self.model_name,
                content=input,
                task_type="retrieval_document"
            )
            return response['embedding']
        except Exception as e:
            print(f"Google Embedding Error: {e}")
            return [[0.0] * 768 for _ in input]
            
    def name(self):
        return "CustomGoogleEmbeddingFunction"

def get_embedding_function():
    if EMBEDDING_PROVIDER == "gemini" and GEMINI_API_KEY:
        return CustomGoogleEmbeddingFunction(
            api_key=GEMINI_API_KEY,
            model_name=EMBEDDING_MODEL
        )
    elif EMBEDDING_PROVIDER == "ollama":
        return embedding_functions.OllamaEmbeddingFunction(
            model_name=EMBEDDING_MODEL or "nomic-embed-text",
            url="http://localhost:11434/api/embeddings"
        )
    else:
        return embedding_functions.DefaultEmbeddingFunction()

def get_collection(name="mindbridge_neural_v2"):
    
    emb_fn = get_embedding_function()
    return client.get_or_create_collection(name=name, embedding_function=emb_fn)
