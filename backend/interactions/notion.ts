const { Client } = require("@notionhq/client");

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

async function getMemories() {
    try {
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DB_ID
        });

        return response.results.map(page => ({
            name: page.properties.Name?.title[0]?.plain_text || "Untitled",
            summary: page.properties.Summary?.rich_text[0]?.plain_text || "",
            workspace: page.properties.Workspace?.rich_text[0]?.plain_text || "Personal",
            url: page.url
        }));
    } catch (error) {
        console.error("[NotionService] Error querying database:", error.message);
        return [];
    }
}
async function getPageContent(pageId) {
    try {
        const page = await notion.pages.retrieve({ page_id: pageId });
        const title = page.properties.title?.title[0]?.plain_text || "Untitled Notion Page";

        const blocks = await notion.blocks.children.list({ block_id: pageId });
        const content = blocks.results
            .map((block) => {
                if (block.type === 'paragraph') return block.paragraph.rich_text.map((t) => t.plain_text).join("");
                if (block.type === 'heading_1') return `# ${block.heading_1.rich_text.map((t) => t.plain_text).join("")}`;
                if (block.type === 'heading_2') return `## ${block.heading_2.rich_text.map((t) => t.plain_text).join("")}`;
                if (block.type === 'bulleted_list_item') return `* ${block.bulleted_list_item.rich_text.map((t) => t.plain_text).join("")}`;
                return "";
            })
            .filter(Boolean)
            .join("\n\n");

        return { title, content };
    } catch (error) {
        console.error("[NotionService] Error fetching page:", error.message);
        throw error;
    }
}

module.exports = { getMemories, getPageContent };