import * as fs from "fs/promises";
import * as path from "path";

export async function getStructuredKnowledge() {
    try {
        // קריאת הקובץ Json  שנוצר  ע"י  Extractor ושמירתו במשתנה
      
       const filePath = path.join(process.cwd(), "structured_data.json");
        const data = await fs.readFile(filePath, "utf-8");
        const knowledge = JSON.parse(data);

        // איסוף כל החוקים וההחלטות למקום אחד נגיש
        const allRules = knowledge.flatMap((item: any) => item.data.rules || []);
        const allDecisions = knowledge.flatMap((item: any) => item.data.decisions || []);
        const allWarnings = knowledge.flatMap((item: any) => item.data.warnings || []);

        return {
            rules: allRules,
            decisions: allDecisions,
            warnings: allWarnings,
            fullData: knowledge
        };
    } catch (error) {
        console.error("Error reading structured knowledge:", error);
        return { rules: [], decisions: [], warnings: [], fullData: [] };
    }
}