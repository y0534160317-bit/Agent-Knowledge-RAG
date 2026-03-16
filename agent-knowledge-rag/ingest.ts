// @ts-nocheck
import "dotenv/config";
import * as llamaindex from "llamaindex";
import { SimpleDirectoryReader } from "@llamaindex/readers/directory";
import { Pinecone } from "@pinecone-database/pinecone"; 
import { PineconeVectorStore } from "@llamaindex/pinecone";
import path from "path";

console.log("Starting ingest.ts script...");

const DIRECTORY_PATH = "../pre-rag-project";
const PINECONE_INDEX_NAME = "agent-knowledge-index";

// מחלקת עזר ל-Cohere (כדי לעקוף את הבעיות בחבילה הרשמית)
class DirectCohereEmbedding extends llamaindex.BaseEmbedding {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }
  async getEmbeddings(texts) {
    const response = await fetch("https://api.cohere.ai/v1/embed", {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ texts, model: "embed-english-v3.0", input_type: "search_document" })
    });
    const data = await response.json();
    return data.embeddings;
  }
  async getTextEmbedding(text) { return (await this.getEmbeddings([text]))[0]; }
  async getQueryEmbedding(query) { return (await this.getEmbeddings([query]))[0]; }
}

async function main() {
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const cohereApiKey = process.env.COHERE_API_KEY;

  if (!pineconeApiKey || !cohereApiKey) {
    console.error("❌ MISSING API KEYS IN .env");
    return;
  }

  console.log("1. Setting up Cohere...");
  llamaindex.Settings.embedModel = new DirectCohereEmbedding(cohereApiKey);

  console.log("2. Checking Pinecone...");
  // הנה השורה שגרמה לשגיאה - וודא שהיא נראית בדיוק ככה:
  const pc = new Pinecone({ apiKey: pineconeApiKey });
  
  const indexList = await pc.listIndexes();
  const exists = indexList.indexes?.some(idx => idx.name === PINECONE_INDEX_NAME);

  if (!exists) {
    console.log("Creating new index...");
    await pc.createIndex({
      name: PINECONE_INDEX_NAME,
      dimension: 1024,
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } }
    });
    // מחכים רגע שהאינדקס יהיה מוכן
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  console.log("3. Loading documents...");
  const reader = new SimpleDirectoryReader();
  const allDocs = await reader.loadData({ directoryPath: DIRECTORY_PATH });
  
  // סינון ידני כדי לוודא שאנחנו לא מעלים 8,000 קבצים מיותרים
  const documents = allDocs.filter(doc => {
    const filePath = doc.metadata.file_path || "";
    return !filePath.includes("node_modules") && 
           !filePath.includes(".git") &&
           (filePath.endsWith(".md") || filePath.endsWith(".tsx") || filePath.endsWith(".ts"));
  });

  console.log(`Loaded ${documents.length} relevant documents (Filtered from ${allDocs.length}).`);

  console.log("4. Uploading to Pinecone (Building Index)...");
  const vectorStore = new PineconeVectorStore({ indexName: PINECONE_INDEX_NAME });
  const storageContext = await llamaindex.storageContextFromDefaults({ vectorStore });
  
// שים לב שכתוב documents ולא docs
await llamaindex.VectorStoreIndex.fromDocuments(documents, { storageContext });
  console.log("✅ SUCCESS: Data is in Pinecone!");
}

main().catch(err => console.error("❌ Error during ingestion:", err));