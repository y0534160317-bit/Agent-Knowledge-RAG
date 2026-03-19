import * as fs from "fs/promises";
import * as path from "path";
import { DirectCohereExtractor } from "./extractor";

export async function runFullExtraction(apiKey: string) {
    const extractor = new DirectCohereExtractor(apiKey);
    const sourceDir = "../pre-rag-project"; // הנתיב לפרויקט השני- הדאטה

    console.log(`--- מחפש קבצים בנתיב: ${path.resolve(sourceDir)} ---`);

    try {
        // פונקציה רקורסיבית פשוטה למציאת כל קבצי ה-md
        const getFiles = async (dir: string): Promise<string[]> => {
            let results: string[] = [];
            const list = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of list) {
                const resPath = path.resolve(dir, entry.name);

                // דילוג על תיקיות מערכת כבדות
                if (entry.name === 'node_modules' || entry.name === '.git') continue;

                if (entry.isDirectory()) {
                    // קריאה רקורסיבית - נכנסים פנימה
                    const res = await getFiles(resPath);
                    results = results.concat(res);
                } else {
                    //   זה קובץ שאנחנו רוצים
                    const lowerName = entry.name.toLowerCase();
                    if (lowerName.endsWith('.md') || lowerName.includes('rules') || lowerName.includes('config')) {
                        results.push(resPath);
                    }
                }
            }
            return results;
        };
        const mdFiles = await getFiles(sourceDir);
        console.log(`מצוין! מצאתי ${mdFiles.length} קבצי Markdown.`);

        const finalDatabase: any[] = [];
        let processedCount = 0;
        for (const filePath of mdFiles) {
            const fileName = path.basename(filePath);
            const fullPath = filePath.toLowerCase();
            const lowerPath = filePath.toLowerCase().replace(/\\/g, '/'); // נרמול נתיבים לווינדוס
            //  סינון תיקיות לא רלוונטיות

            // בדיקה: האם זה בתוך node_modules?
            if (lowerPath.includes('node_modules')) {
                continue; 
            }

            console.log(`בודק קובץ: ${fileName} בנתיב: ${lowerPath}`);

            // סינון  של דברים  לא רלוונטיים
            if (lowerPath.includes('.git') || lowerPath.includes('dist') || lowerPath.includes('build')) {
                continue;
            }

            processedCount++; 
            console.log(`מעבד את: ${fileName}...`);
            try {
                const content = await fs.readFile(filePath, "utf-8");
                if (!content.trim()) continue;

                const extractedInfo = await extractor.extract(content);

                finalDatabase.push({
                    sourceFile: fileName,
                    fullPath: filePath,
                    extractedAt: new Date().toISOString(),
                    data: extractedInfo
                });
            } catch (err) {
                console.error(`שגיאה בקריאת הקובץ ${fileName}:`, err);
            }
        }
        
        console.log(`הושלם! עיבדתי ${processedCount} קבצים רלוונטיים.`);

        // שמירה לקובץ JSON
        await fs.writeFile("./structured_data.json", JSON.stringify(finalDatabase, null, 2));
        console.log("✅ סיימתי! נוצר קובץ בשם structured_data.json");

    } catch (error) {
        console.error("שגיאה בתהליך הסריקה:", error);
    }
}