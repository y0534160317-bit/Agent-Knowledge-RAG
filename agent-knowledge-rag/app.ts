import express from "express";
import { VectorStoreIndex, Settings, BaseEmbedding, MetadataMode } from "llamaindex";
import { PineconeVectorStore } from "@llamaindex/pinecone";
import * as dotenv from "dotenv";
import { QueryWorkflow } from "./QueryWorkflow";
dotenv.config();

const app = express();
app.use(express.json());

// --- כל הלוגיקה המנצחת שלך כאן ---

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
    return data.embeddings[0];
}

class DirectCohereLLM {
    metadata = { model: "command-r-plus-08-2024", temperature: 0.1, contextWindow: 4000 };


    async chat(params: any): Promise<any> {
        console.log("DEBUG: Attempting to fetch from Cohere..."); // לוג חדש
        if (!process.env.COHERE_API_KEY) console.error("DEBUG: API KEY IS MISSING!");


        const lastMessage = params.messages[params.messages.length - 1].content;

        const response = await fetch("https://api.cohere.ai/v1/chat", {
            method: "POST",
            headers: {
                "Authorization": `BEARER ${process.env.COHERE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "command-r-plus-08-2024",
                message: lastMessage,
                temperature: 0.1
            }),
        });

        const data = await response.json();

        // זה השינוי הקריטי - LlamaIndex צריך את השדה 'message' במבנה הזה:
        return {
            message: {
                content: data.text || "",
                role: "assistant"
            },
            // הוספת השדה הזה עוזרת ל-LlamaIndex לחלץ את הטקסט בקלות
            text: data.text || ""
        };
    }


    async complete(params: any): Promise<any> {
        const prompt = typeof params === "string" ? params : params.prompt;
        return this.chat({ messages: [{ role: "user", content: prompt }] });
    }
}
const customEmbedder = {
    modelName: "embed-english-v3.0",
    getQueryEmbedding: async (query: any) => await getCohereEmbedding(typeof query === "string" ? query : query.text || ""),
    getTextEmbedding: async (text: string) => await getCohereEmbedding(text),
    getTextEmbeddings: async (texts: string[]) => Promise.all(texts.map(t => getCohereEmbedding(t))),
    transform: (nodes: any) => nodes,
};

// --- הגדרות השרת ---

app.get("/", (req, res) => {
    res.send(`
        <html>
        <head>
            <title>My RAG Chat</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #eceff1; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                #container { width: 450px; height: 600px; background: white; border-radius: 15px; display: flex; flex-direction: column; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
                #chat { flex: 1; overflow-y: auto; padding: 20px; }
                .msg { margin-bottom: 15px; padding: 10px; border-radius: 10px; max-width: 80%; }
                .user { background: #007bff; color: white; align-self: flex-end; margin-left: auto; }
                .ai { background: #e9e9eb; color: #333; }
                #input-area { display: flex; padding: 15px; border-top: 1px solid #eee; }
                input { flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 5px; outline: none; }
                button { background: #007bff; color: white; border: none; padding: 10px 20px; margin-left: 10px; border-radius: 5px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div id="container">
                <div id="chat"></div>
                <div id="input-area">
                    <input id="user-input" placeholder="Ask me about Claude Code..." onkeypress="if(event.key==='Enter') send()">
                    <button onclick="send()">Send</button>
                </div>
            </div>
            <script>
                async function send() {
                    const input = document.getElementById('user-input');
                    const chat = document.getElementById('chat');
                    if (!input.value.trim()) return;

                    const userMsg = input.value;
                    chat.innerHTML += '<div class="msg user">' + userMsg + '</div>';
                    input.value = '';
                    chat.scrollTop = chat.scrollHeight;

                    const res = await fetch('/ask', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ question: userMsg })
                    });
                    const data = await res.json();
                    chat.innerHTML += '<div class="msg ai">' + data.answer + '</div>';
                    chat.scrollTop = chat.scrollHeight;
                }
            </script>
        </body>
        </html>
    `);
});

// app.post("/ask", async (req, res) => {
//     try {
//         const { question } = req.body;
//         console.log(`\n--- New Question: ${question} ---`);

//         Settings.embedModel = customEmbedder as any;
//         Settings.llm = new DirectCohereLLM() as any;

//         const vectorStore = new PineconeVectorStore({
//             apiKey: process.env.PINECONE_API_KEY,
//             indexName: "agent-knowledge-index",
//         });

//         const index = await VectorStoreIndex.fromVectorStore(vectorStore);

//         const retriever = index.asRetriever({ similarityTopK: 3 });
//         const nodes = await retriever.retrieve(question);

//         console.log(`Found ${nodes.length} relevant chunks in Pinecone.`);
//         nodes.forEach((n, i) => {
//             console.log(`Chunk ${i + 1} preview: ${n.node.getContent(MetadataMode.NONE).substring(0, 100)}...`);
//         });

//         const queryEngine = index.asQueryEngine({
//             retriever,
//         });

//         const response = await queryEngine.query({
//             query: `You are a technical assistant. Use the provided context to answer the question. 
//                     If the context doesn't contain the answer, say you don't know based on the documents, 
//                     but try to explain what the documents DO cover.
//                     Question: ${question}`
//         });

//         // שינוי כאן: חילוץ התשובה בצורה מפורשת יותר
//         const finalAnswer = response.response || response.toString();

//         console.log(`AI Answered: ${finalAnswer.substring(0, 100)}...`);

//         // וידוא שהתשובה אינה מחרוזת ריקה או אובייקט ריק
//         if (!finalAnswer || finalAnswer === "{}" || finalAnswer.trim() === "") {
//             res.json({ answer: "The AI found information but had trouble formatting the response. Please try again." });
//         } else {
//             res.json({ answer: finalAnswer });
//         }

//     } catch (e: any) {
//         console.error("Error in /ask:", e);
//         res.json({ answer: "Error: " + e.message });
//     }
// });


// ... שאר הקוד

app.post("/ask", async (req, res) => {
    try {
        const { question } = req.body;
        console.log(`\n--- New Request: ${question} ---`);

        // הגדרות כרגיל (נשארות אותו דבר)
        Settings.embedModel = customEmbedder as any;
        Settings.llm = new DirectCohereLLM() as any;

        console.log("DEBUG: Checking Pinecone config...");
        console.log("API Key exists:", !!process.env.PINECONE_API_KEY);
        console.log("Index Name:", "agent-knowledge-index");



        const vectorStore = new PineconeVectorStore({
            apiKey: process.env.PINECONE_API_KEY,
            indexName: "agent-knowledge-index",
        });



        const index = await VectorStoreIndex.fromVectorStore(vectorStore);
        const retriever = index.asRetriever({ similarityTopK: 3 });
        const queryEngine = index.asQueryEngine({ retriever });



        // --- כאן השינוי! במקום להריץ לוגיקה, מפעילים את ה-Workflow ---
        const workflow = new QueryWorkflow(retriever, queryEngine);

        // ה-workflow יחזיר תשובה רק כשיסיים את כל הצעדים והבדיקות
        const finalAnswer = await workflow.execute(question);

        res.json({ answer: finalAnswer });

    } catch (e: any) {
        // אם ה-Workflow זרק שגיאה (כמו "שאלה קצרה מדי"), היא תיתפס כאן
        console.error("Workflow Error:", e);
        res.json({ answer: "שימי לב: " + e });
    }
});



app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));