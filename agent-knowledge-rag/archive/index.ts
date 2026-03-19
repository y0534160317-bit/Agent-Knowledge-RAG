
import { runFullExtraction } from "./processor";
import * as dotenv from "dotenv";

dotenv.config();

console.log("--- DEBUG: הקובץ התחיל לרוץ ---");

async function start() {
    console.log("--- DEBUG: נכנס לפונקציית start ---");
    const key = process.env.COHERE_API_KEY;
    
    if (!key) {
        console.error("--- DEBUG: חסר API KEY ב-.env ---");
        return;
    }

    try {
        await runFullExtraction(key);
        console.log("--- DEBUG: סיים את runFullExtraction ---");
    } catch (e) {
        console.error("--- DEBUG: שגיאה בקריאה ל-processor ---", e);
    }
}


start();