export class DirectCohereExtractor {
  private apiKey: string;
  private apiUrl = "https://api.cohere.ai/v1/chat";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extract(text: string) {
    const prompt = `Extract technical decisions, rules, and warnings from the following text. 
    Return ONLY a JSON object with this structure: 
    {"decisions": [], "rules": [], "warnings": []}.
    
    Text:
    ${text}`;
    
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
  model: "command-r7b-12-2024",
          message: prompt,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();

      // בדיקה אם ה-API החזיר שגיאה
      if (data.message && !data.text) {
          console.error("Cohere API Error:", data.message);
          return { decisions: [], rules: [], warnings: [] };
      }

      // חילוץ הטקסט - ב-Cohere זה בד"כ בשדה data.text
      const rawText = data.text || "";
      
      if (!rawText) {
          console.warn("⚠️ התקבלה תשובה ריקה מהמודל");
          return { decisions: [], rules: [], warnings: [] };
      }

      return JSON.parse(rawText);
    } catch (e) {
      console.error("❌ שגיאה בניתוח ה-JSON של Cohere:", e);
      return { decisions: [], rules: [], warnings: [] };
    }
  }
}