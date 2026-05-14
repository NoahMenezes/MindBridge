require("dotenv").config({ path: ".env" });
const express = require("express");
const cors = require("cors");
const { getMemories, getPageContent } = require("./notion");

const app = express();

// Enable CORS for the browser extension
app.use(cors());
app.use(express.json());

app.get("/notion/memories", async (req, res) => {
    try {
        const data = await getMemories();
        res.json(data);
    } catch (error) {
        console.error("Notion API Error:", error);
        res.status(500).json({ error: "Failed to fetch Notion memories" });
    }
});

app.post("/notion/page", async (req, res) => {
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