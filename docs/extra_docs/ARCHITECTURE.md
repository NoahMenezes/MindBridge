# MindBridge Architecture

## High-Level Overview
MindBridge uses a client-server architecture where the browser extension acts as the data collector and context injector, while the FastAPI backend handles the heavy lifting of RAG analysis and vector storage.

## Communication
- **REST**: Background scripts talk to the backend via secure REST endpoints.
- **Chrome Messaging**: Content scripts talk to the background script using `chrome.runtime.sendMessage`.
- **Firebase**: Authentication is handled client-side with JWTs passed to the backend for verification.
