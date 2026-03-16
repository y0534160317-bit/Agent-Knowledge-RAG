// import { NodeWithScore, MetadataMode, VectorStoreIndex, Settings } from "llamaindex";
// //, PineconeVectorStore
// // --- 1. הגדרות טיפוסים (Types) ---

// type QueryEvent =
//   | { type: "START"; payload: { query: string } }
//   | { type: "QUERY_VALIDATED"; payload: { query: string } }
//   | { type: "CONTEXT_RETRIEVED"; payload: { nodes: NodeWithScore[] } }
//   | { type: "CONFIDENCE_CHECK_PASSED"; payload: { nodes: NodeWithScore[] } }
//   | { type: "RESPONSE_GENERATED"; payload: { response: string } }
//   | { type: "RETRY_REQUIRED"; payload: { reason: string } }
//   | { type: "ERROR"; payload: { message: string } };

// type QueryState = {
//   query?: string;
//   nodes?: NodeWithScore[];
//   response?: string;
//   status: "idle" | "processing" | "completed" | "error";
//   error?: string;
// };

// // --- 2. מחלקת ה-Workflow ---

// export class QueryWorkflow {
//   private state: QueryState = { status: "idle" };
//   private onComplete?: (response: string) => void;
//   private onError?: (error: string) => void;

//   constructor(
//     private retriever: any, 
//     private queryEngine: any
//   ) {}

//   // פונקציה חיצונית להפעלת ה-Workflow והמתנה לתוצאה
//   public async execute(query: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       this.onComplete = resolve;
//       this.onError = reject;
//       this.emit({ type: "START", payload: { query } });
//     });
//   }

//   private emit(event: QueryEvent) {
//     console.log(`[Workflow Step]: ${event.type}`);
//     // שימוש ב-setImmediate כדי לאפשר ל-Event Loop לנשום
//     setImmediate(() => this.handleEvent(event));
//   }

//   private async handleEvent(event: QueryEvent) {
//     try {
//       switch (event.type) {
//         case "START":
//           this.state.status = "processing";
//           this.state.query = event.payload.query;

//           // ולידציה 1: בדיקת קלט ריק או קצר מדי
//           if (!event.payload.query || event.payload.query.trim().length < 3) {
//             return this.emit({ type: "ERROR", payload: { message: "השאלה קצרה מדי. אנא נסחי שאלה מפורטת יותר." } });
//           }
//           this.emit({ type: "QUERY_VALIDATED", payload: { query: event.payload.query } });
//           break;

//         case "QUERY_VALIDATED":
//           // שלב השליפה (Retrieval)
//           console.log("🔍 Searching for context in Pinecone...");
//           const nodes = await this.retriever.retrieve(event.payload.query);
//           this.emit({ type: "CONTEXT_RETRIEVED", payload: { nodes } });
//           break;

//         case "CONTEXT_RETRIEVED":
//           this.state.nodes = event.payload.nodes;

//           // ולידציה 2: האם נמצאו תוצאות בכלל?
//           if (!event.payload.nodes || event.payload.nodes.length === 0) {
//             return this.emit({ type: "ERROR", payload: { message: "לא נמצא מידע רלוונטי במסמכים עבור שאילתה זו." } });
//           }

//           // ולידציה 3: בדיקת Confidence (ציון דמיון ממוצע)
//           const avgScore = event.payload.nodes.reduce((acc, n) => acc + (n.score || 0), 0) / event.payload.nodes.length;
//           console.log(`📊 Average Similarity Score: ${avgScore.toFixed(4)}`);

//           if (avgScore < 0.65) { // סף ביטחון - מתחת לזה המידע כנראה לא רלוונטי מספיק
//             return this.emit({ type: "RETRY_REQUIRED", payload: { reason: "Low similarity score" } });
//           }

//           this.emit({ type: "CONFIDENCE_CHECK_PASSED", payload: { nodes: event.payload.nodes } });
//           break;

//         case "CONFIDENCE_CHECK_PASSED":
//           // שלב יצירת התשובה (Generation)
//           console.log("🤖 Generating response with LLM...");
//           const response = await this.queryEngine.query({ query: this.state.query });
//           const finalAnswer = response.toString();

//           this.emit({ type: "RESPONSE_GENERATED", payload: { response: finalAnswer } });
//           break;

//         case "RESPONSE_GENERATED":
//           this.state.status = "completed";
//           this.state.response = event.payload.response;
//           if (this.onComplete) this.onComplete(event.payload.response);
//           break;

//         case "RETRY_REQUIRED":
//           // בשלב זה אפשר להחליט אם לנסות שוב או לעצור. כרגע נעצור עם הסבר.
//           return this.emit({ type: "ERROR", payload: { message: "נמצא מידע, אך רמת הביטחון בדיוק שלו נמוכה. נסי לנסח מחדש." } });

//         case "ERROR":
//           this.state.status = "error";
//           this.state.error = event.payload.message;
//           if (this.onError) this.onError(event.payload.message);
//           break;
//       }
//     } catch (err: any) {
//       console.error("Workflow Runtime Error:", err);
//       this.emit({ type: "ERROR", payload: { message: "אירעה שגיאה בלתי צפויה בתהליך העיבוד." } });
//     }
//   }
// }

import { NodeWithScore, MetadataMode } from "llamaindex";

type QueryEvent =
    | { type: "START"; payload: { query: string } }
    | { type: "QUERY_VALIDATED"; payload: { query: string } }
    | { type: "CONTEXT_RETRIEVED"; payload: { nodes: NodeWithScore[] } }
    | { type: "CONFIDENCE_CHECK_PASSED"; payload: { nodes: NodeWithScore[] } }
    | { type: "RESPONSE_GENERATED"; payload: { response: string } }
    | { type: "RETRY_REQUIRED"; payload: { reason: string } }
    | { type: "ERROR"; payload: { message: string } }
    | { type: "REPHRASE_QUERY"; payload: { originalQuery: string } }

type QueryState = {
    query?: string;
    originalQuery?: string;
    retryCount: number;
    nodes?: NodeWithScore[];
};


export class QueryWorkflow {
    private state: QueryState = { retryCount: 0 };
    private onComplete?: (response: string) => void;
    private onError?: (error: string) => void;
    // private state: { query?: string } = {};

    constructor(private retriever: any, private queryEngine: any) { }

    public async execute(query: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.onComplete = resolve;
            this.onError = reject;
            this.state = { query, originalQuery: query, retryCount: 0 };
            this.emit({ type: "START", payload: { query } });
        });
    }

    private emit(event: QueryEvent) {
        console.log(`[Workflow Step]: ${event.type}`);
        setImmediate(() => this.handleEvent(event));
    }

    private async handleEvent(event: QueryEvent) {
        try {
            switch (event.type) {
                case "START":
                    this.state.query = event.payload.query;
                    if (!event.payload.query || event.payload.query.trim().length < 3) {
                        return this.emit({ type: "ERROR", payload: { message: "שאלה קצרה מדי." } });
                    }
                    this.emit({ type: "QUERY_VALIDATED", payload: { query: event.payload.query } });
                    break;

                case "QUERY_VALIDATED":
                    const nodes = await this.retriever.retrieve(event.payload.query);
                    this.emit({ type: "CONTEXT_RETRIEVED", payload: { nodes } });
                    break;

                case "CONTEXT_RETRIEVED":
                    if (!event.payload.nodes || event.payload.nodes.length === 0) {
                        return this.emit({ type: "ERROR", payload: { message: "לא נמצא מידע במסמכים." } });
                    }

                    // חישוב Confidence Score
                    const avgScore = event.payload.nodes.reduce((acc, n) => acc + (n.score || 0), 0) / event.payload.nodes.length;
                    console.log(`📊 Similarity Score: ${avgScore.toFixed(4)}`);

                    if (avgScore < 0.5
                    ) {
                        return this.emit({ type: "RETRY_REQUIRED", payload: { reason: "Low score" } });
                    }
                    this.emit({ type: "CONFIDENCE_CHECK_PASSED", payload: { nodes: event.payload.nodes } });
                    break;

                case "CONFIDENCE_CHECK_PASSED":
                    const response = await this.queryEngine.query({ query: this.state.query });
                    const finalAnswer = response.response || response.toString();
                    this.emit({ type: "RESPONSE_GENERATED", payload: { response: finalAnswer } });
                    break;

                case "RESPONSE_GENERATED":
                    if (this.onComplete) this.onComplete(event.payload.response);
                    break;

                case "ERROR":
                    if (this.onError) this.onError(event.payload.message);
                    break;

                case "RETRY_REQUIRED":
                    if (this.state.retryCount >= 5) {
                        console.log("⚠️ Too many retries. Giving up.");
                        return this.emit({ type: "ERROR", payload: { message: "לא מצאתי מידע מדויק מספיק לאחר מספר ניסיונות. אולי תוכלי לפרט יותר?" } });
                    }
                    this.state.retryCount++;
                    console.log(`🔄 Retry #${this.state.retryCount}: Rephrasing...`);
                    const rephrasePrompt = `The user asked: "${this.state.originalQuery}". 
            My technical search for "${this.state.query}" was not specific enough. 
            Rewrite this to be a more effective search query for technical documentation, 
            but do NOT add new requirements. Return ONLY the text.`;



                    const aiResponse = await this.queryEngine.query({ query: rephrasePrompt });
                    const newQuery = aiResponse.toString().trim();

                    console.log(`🆕 New Query: ${newQuery}`);

                    // עדכון ה-State והרצה חוזרת של החיפוש!
                    this.state.query = newQuery;

                    this.emit({ type: "QUERY_VALIDATED", payload: { query: newQuery } });
                    break;
            }
        } catch (err: any) {
            if (this.onError) this.onError(err.message);
        }
    }
}