
import { 
    VectorStoreIndex, 
    Settings, 
    BaseEmbedding,
    MetadataMode
  } from "llamaindex";
  import { PineconeVectorStore } from "@llamaindex/pinecone";
  import * as dotenv from "dotenv";
  
  dotenv.config();
  
  /**
   * 1. פונקציית הזרקת ווקטורים (Embedding) ישירות מ-Cohere
   */
  async function getCohereEmbedding(text: string): Promise<number[]> {
    const response = await fetch("https://api.cohere.ai/v1/embed", {
      method: "POST",
      headers: {
        "Authorization": `BEARER ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts: [text],
        model: "embed-english-v3.0",
        input_type: "search_query", 
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Cohere Embed Error: ${JSON.stringify(data)}`);
    return data.embeddings[0];
  }
  
  /**
   * 2. מימוש ידני של ה-LLM כדי לעקוף את החבילות השבורות
   */
  class DirectCohereLLM {
    metadata = { model: "command-r-plus-08-2024", temperature: 0.1, contextWindow: 4000 };

  
    // פונקציה למבנה של צ'אט
    async chat(params: any): Promise<any> {
      const messages = params.messages;
      const lastMessage = messages[messages.length - 1].content;
      
      const response = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          "Authorization": `BEARER ${process.env.COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: lastMessage,
            model: "command-r-plus-08-2024", // העדכון כאן
          }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(`Cohere Chat Error: ${JSON.stringify(data)}`);
      
      return {
        message: { content: data.text, role: "assistant" }
      };
    }
  
    // הפונקציה שהייתה חסרה וגרמה לשגיאה
    async complete(params: any): Promise<any> {
      const prompt = typeof params === "string" ? params : params.prompt;
      const response = await this.chat({
        messages: [{ role: "user", content: prompt }]
      });
      return response;
    }
  }
  
  /**
  /**
 * 3. מימוש פשוט של ה-Embedder ללא ירושה (עוקף את שגיאת ה-Constructor)
 */
const customEmbedder = {
    modelName: "embed-english-v3.0",
    // הפונקציות ש-LlamaIndex מחפשת
    getQueryEmbedding: async (query: any) => await getCohereEmbedding(typeof query === "string" ? query : query.text || ""),
    getTextEmbedding: async (text: string) => await getCohereEmbedding(text),
    getTextEmbeddings: async (texts: string[]) => Promise.all(texts.map(t => getCohereEmbedding(t))),
    // הוספת פונקציית טרנספורמציה בסיסית שנדרשת לפעמים
    transform: (nodes: any) => nodes,
  };
  
  /**
   * 4. הפונקציה המרכזית
   */
  async function runQuery(userQuestion: string) {
    try {
      console.log(`\n🔎 Searching for: "${userQuestion}"...`);
  
      // כאן אנחנו מזריקים את האובייקטים שיצרנו
      Settings.embedModel = customEmbedder as any;
      Settings.llm = new DirectCohereLLM() as any;
  
      const vectorStore = new PineconeVectorStore({
        apiKey: process.env.PINECONE_API_KEY,
        indexName: "agent-knowledge-index", 
      });
  
      const index = await VectorStoreIndex.fromVectorStore(vectorStore);
      
      // יצירת מנוע השאילתות
      const queryEngine = index.asQueryEngine();
  
      console.log("🤖 AI is formulating an answer...");
      const response = await queryEngine.query({ query: userQuestion });
  
      console.log("\n✅ AI Final Answer:");
      console.log(response.toString());
  
    } catch (error: any) {
      console.error("❌ Error:", error.message || error);
    }
  }
  
  runQuery("What are the default folders for Claude Code?");