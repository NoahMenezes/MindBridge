const API_BASE_URL = process.env.PLASMO_PUBLIC_BACKEND_URL || "http://localhost:8000";

export type MemoryType = "project" | "preference" | "goal" | "collaborator" | "note" | "context";

export interface Memory {
  id: string;
  workspace: string;
  type: MemoryType;
  summary: string;
  content: string;
  score: number;
  tags: string[];
  timestamp: string;
}

export const addMemory = async (content: string, workspace: string, type: MemoryType = "note", tags: string[] = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}/add_memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, workspace, type, tags })
    });
    return await response.json();
  } catch (error) {
    console.error("API Error (add_memory):", error);
    return null;
  }
};

export const searchMemories = async (query: string, workspace: string, limit: number = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search_memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, workspace, limit })
    });
    return await response.json();
  } catch (error) {
    console.error("API Error (search_memories):", error);
    return { memories: [], count: 0 };
  }
};

export const extractIdentity = async (history: string, workspace: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/extract_identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, workspace })
    });
    return await response.json();
  } catch (error) {
    console.error("API Error (extract_identity):", error);
    return null;
  }
};

export const storeRawChat = async (raw_content: string, workspace: string, source: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/store_raw_chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_content, workspace, source })
    });
    return await response.json();
  } catch (error) {
    console.error("API Error (store_raw_chat):", error);
    return null;
  }
};

export const getRecentChats = async (workspace: string = "Personal") => {
  try {
    const response = await fetch(`${API_BASE_URL}/recent_chats?workspace=${workspace}`);
    return await response.json();
  } catch (error) {
    console.error("API Error (get_recent_chats):", error);
    return { chats: [] };
  }
};

export const getWorkspaceContext = async (workspace: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/get_workspace_context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace })
    });
    return await response.json();
  } catch (error) {
    console.error("API Error (get_workspace_context):", error);
    return null;
  }
};

export const detectIdentityApi = async (messages: any[], workspace: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/detect_identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, workspace })
    });
    return await response.json();
  } catch (error) {
    console.error("API Error (detect_identity):", error);
    return { status: "error", error: "Backend unreachable" };
  }
};

export const getRelevantMemories = async (query: string, workspace: string = "Personal") => {
  try {
    const response = await fetch(`${API_BASE_URL}/get_relevant_memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, workspace })
    });
    return await response.json();
  } catch (error) {
    console.error("API Error (get_relevant_memories):", error);
    return { status: "error", memories: [] };
  }
};
