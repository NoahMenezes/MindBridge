import chromadb
from chromadb.utils import embedding_functions
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_store")
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "default").lower()
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")

# Initialize persistent ChromaDB client
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

def get_embedding_function():
    if EMBEDDING_PROVIDER == "openai":
        return embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name=EMBEDDING_MODEL or "text-embedding-3-small"
        )
    elif EMBEDDING_PROVIDER == "ollama":
        # Ollama embedding function (requires chromadb >= 0.4.15)
        return embedding_functions.OllamaEmbeddingFunction(
            model_name=EMBEDDING_MODEL or "nomic-embed-text",
            url="http://localhost:11434/api/embeddings"
        )
    else:
        # Default ChromaDB embedding function (SentenceTransformers)
        return embedding_functions.DefaultEmbeddingFunction()

def get_collection(name="mindbridge_memories"):
    emb_fn = get_embedding_function()
    return client.get_or_create_collection(name=name, embedding_function=emb_fn)
