import { Client } from "@notionhq/client"
import { addMemory, MemoryType } from "./api"

/**
 * NotionSyncService handles the ingestion of data from Notion pages 
 * into the MindBridge RAG engine.
 */
export class NotionSyncService {
  async syncPage(pageUrlOrId: string, workspace: string = "Personal") {
    // 1. Smart Parser: Extract ID if a full URL is pasted
    let pageId = pageUrlOrId.trim();
    if (pageId.includes("notion.so/")) {
      const parts = pageId.split("/");
      const lastPart = parts[parts.length - 1];
      const match = lastPart.match(/[a-f0-9]{32}/);
      if (match) {
        pageId = match[0];
      }
    }

    try {
      // 2. Fetch from our local Interactions Server
      const response = await fetch("http://localhost:3000/notion/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const { title, content } = await response.json();

      if (!content) {
        console.warn("[NotionSync] No readable content found in page.")
        return null
      }

      // 3. Store in MindBridge via the RAG Engine
      console.log(`[NotionSync] Teleporting "${title}" to MindBridge...`)
      
      const result = await addMemory(
        `[NOTION IMPORT: ${title}]\n\n${content}`,
        workspace,
        "note" as MemoryType,
        ["notion-sync", "imported"]
      )

      return {
        success: true,
        memoryId: result?.id,
        title
      }
    } catch (error: any) {
      console.error("[NotionSync] Failed to sync page:", error.message)
      throw error
    }
  }
}

export const notionSync = new NotionSyncService()
