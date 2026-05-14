import chromadb
from chromadb.config import Settings
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_store")

# Initialize persistent ChromaDB client
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

def get_collection(name="mindbridge_memories"):
    return client.get_or_create_collection(name=name)
