

import { NodeWithScore, MetadataMode, Settings } from "llamaindex";
import { getStructuredKnowledge } from "./knowledgeBase";

type QueryEvent =
    | { type: "START"; payload: { query: string } }
    | { type: "QUERY_VALIDATED"; payload: { query: string } }
    | { type: "KNOWLEDGE_BASE_CHECK"; payload: { query: string } }
    | { type: "CONTEXT_RETRIEVED"; payload: { nodes: NodeWithScore[] } }
    | { type: "CONFIDENCE_CHECK_PASSED"; payload: { nodes: NodeWithScore[] } }
    | { type: "RESPONSE_GENERATED"; payload: { response: string } }
    | { type: "RESPONSE_VALIDATED"; payload: { response: string } }
    | { type: "RETRY_REQUIRED"; payload: { reason: string } }
    | { type: "ERROR"; payload: { message: string } };

type QueryState = {
    query?: string;
    originalQuery?: string;
    retryCount: number;
    nodes?: NodeWithScore[];
    status: "idle" | "processing" | "completed" | "error";
};


export class QueryWorkflow {
    private state: QueryState = { retryCount: 0, status: "idle" }; private onComplete?: (response: string) => void;
    private onError?: (error: string) => void;

    constructor(private retriever: any, private queryEngine: any) { }

    public async execute(query: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.onComplete = resolve;
            this.onError = reject;
            this.state = {
                query,
                originalQuery: query,
                retryCount: 0,
                status: "processing"
            };
            this.emit({ type: "START", payload: { query } });
        });
    }

    private emit(event: QueryEvent) {
        console.log(`[Workflow Step]: ${event.type}`);
        setTimeout(() => this.handleEvent(event), 0);
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
                    this.emit({ type: "KNOWLEDGE_BASE_CHECK", payload: { query: event.payload.query } });
                    break;


                case "KNOWLEDGE_BASE_CHECK":
                    const query = event.payload.query.toLowerCase();
                    const kb = await getStructuredKnowledge();

                    // 1. שיפור זיהוי מילות מפתח
                    const ruleKeywords = ["rule", "standard", "how to", "decision", "state", "folder", "tailwind", "component"];
                    const isRuleQuery = ruleKeywords.some(word => query.includes(word));

                    if (isRuleQuery) {
                        // 2. שיפור החיפוש בתוך החוקים - מחפש אם המילה קיימת בתוך המשפט
                        const relevantRules = kb.rules.filter((r: string) => {
                            const lowerRule = r.toLowerCase();
                            // בודק אם אחת המילים מהשאלה מופיעה בתוך החוק
                            return query.split(" ").some(word => word.length > 3 && lowerRule.includes(word)) ||
                                ruleKeywords.some(key => query.includes(key) && lowerRule.includes(key));
                        });

                        if (relevantRules.length > 0) {
                            console.log(`🎯 Router: Match found in JSON! Synthesizing...`);
                            const synthesisPrompt = `
                                You are a technical lead. Use the following project rules to answer the question.
                                
                                RULES:
                                ${relevantRules.join("\n")}
                                
                                QUESTION: ${query}
                                
                                ANSWER:`;
                            const aiResponse = await Settings.llm.chat({
                                messages: [{ role: "user", content: synthesisPrompt }]
                            });
                            const finalString = aiResponse.message.content.toString();
                            return this.emit({
                                type: "RESPONSE_GENERATED",
                                payload: { response: finalString }
                            });
                        }
                    }

                    console.log("🔍 Router: No match in JSON. Falling back to Pinecone...");
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

                case "RESPONSE_GENERATED":
                    const aiAnswer = event.payload.response;
                    console.log("🛡️ Guarding Response...");

                    // ולידציה על הפלט:
                    // א. האם התשובה קצרה מדי? (למשל פחות מ-10 תווים)
                    // ב. האם היא מכילה ביטויים של "אני לא יודע" למרות שמצאנו מידע?
                    const isIdontKnow = aiAnswer.toLowerCase().includes("don't know") || aiAnswer.includes("not found");

                    if (aiAnswer.length < 10) {
                        return this.emit({ type: "ERROR", payload: { message: "ה-AI יצר תשובה קצרה מדי. משהו השתבש בתהליך." } });
                    }

                    if (isIdontKnow && this.state.retryCount < 2) {
                        console.log("⚠️ AI says it doesn't know, but we have context. Forcing one more rephrase...");
                        return this.emit({ type: "RETRY_REQUIRED", payload: { reason: "AI denial with context" } });
                    }

                    // אם הכל תקין, עוברים לאירוע הסופי
                    this.emit({ type: "RESPONSE_VALIDATED", payload: { response: aiAnswer } });
                    break;

                case "RESPONSE_VALIDATED":
                    this.state.status = "completed";
                    if (this.onComplete) this.onComplete(event.payload.response);
                    break;
            }
        } catch (err: any) {
            if (this.onError) this.onError(err.message);
        }
    }
}