import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import express from "express";
import cors from "cors";
import { getMemories, getPageContent } from "./notion";

const app = express();

// Enable CORS for the browser extension
app.use(cors());
app.use(express.json());

app.get("/notion/memories", async (req: express.Request, res: express.Response) => {
    try {
        const data = await getMemories();
        res.json(data);
    } catch (error) {
        console.error("Notion API Error:", error);
        res.status(500).json({ error: "Failed to fetch Notion memories" });
    }
});

app.post("/notion/page", async (req: express.Request, res: express.Response) => {
    try {
        const { pageId } = req.body;
        if (!pageId) return res.status(400).json({ error: "pageId is required" });
        const data = await getPageContent(pageId);
        res.json(data);
    } catch (error) {
        console.error("Notion Page Error:", error);
        res.status(500).json({ error: "Failed to fetch Notion page" });
    }
});

const PORT = process.env.INTERACTIONS_PORT || 3000;
app.listen(PORT, () => {
    console.log(`[Interactions] Server running on port ${PORT}`);
    console.log(`[Interactions] Notion Token: ${process.env.NOTION_TOKEN ? "LOADED" : "MISSING"}`);
    console.log(`[Interactions] Notion DB: ${process.env.NOTION_DB_ID ? "LOADED" : "MISSING"}`);
});