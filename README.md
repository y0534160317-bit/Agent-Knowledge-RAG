# 🤖 AI Technical Lead Agent: Project-Specific RAG

מערכת Agent חכמה המבוססת על ארכיטקטורת **RAG (Retrieval-Augmented Generation)**. המערכת עוצבה כדי לשמש כ-"Technical Lead" שמכיר לעומק פרויקט קיים, ויודע לשלב בין חוקי פרויקט נוקשים (Structured Data) לבין תיעוד טכני רחב (Unstructured Data).



---

## 📁 מבנה התיקיות (Project Structure)

ה-Repository כולל את המערכת ואת פרויקט המקור עליו היא "התאמנה":

* **`agent-knowledge-rag/`**: ליבת המערכת - מכילה את ה-Workflow, את ה-Router ואת האינטגרציה עם ה-LLM.
* **`pre-rag-project/`**: פרויקט המטרה (Todo App ב-React/TS). זהו המקור ממנו נגזרו החוקים והתיעוד.
* **`structured_data.json`**: בסיס הידע המובנה שחולץ מקבצי ה-Config וה-Rules של הפרויקט.

---

## 🧠 תהליך העבודה (The QueryWorkflow)

הלב של המערכת הוא קלאס ה-`QueryWorkflow`, שמנהל את "מסע השאילתה" של המשתמש דרך מספר שלבים מבוססי אירועים (Events):

1.  **Smart Routing**: המערכת מנתחת את השאילתה. אם המשתמש שואל על חוקי קידוד (כמו שימוש ב-`any`), מבנה תיקיות או טכנולוגיות ספציפיות, ה-Router שולף מידע מיידי מ-`structured_data.json`.
2.  **Semantic Search**: במידה ולא נמצאה התאמה ב-JSON, המערכת עוברת לחיפוש סמנטי ב-**Pinecone** בתוך מסמכי ה-Markdown של הפרויקט (`PRD`, `ARCHITECTURE`).
3.  **Confidence & Rephrase**: המערכת מחשבת Similarity Score. אם התוצאות לא מדויקות מספיק (ציון נמוך מ-0.4), ה-AI מנסח מחדש את השאילתה (Rephrasing) ומנסה לאתר מידע טוב יותר.
4.  **Synthesis & Guardrails**: המודל (Cohere) מייצר תשובה טכנית מנומקת. לפני ההצגה, המערכת מוודאת שהתשובה איכותית, ארוכה מספיק ואינה מכילה "I don't know" במקומות שבהם קיים מידע.



---

## 🛠️ טכנולוגיות (Tech Stack)

* **Framework**: LlamaIndex (TS) - לניהול ה-RAG וה-Workflows.
* **LLM**: Cohere (Command R) - לניתוח ויצירת טקסט.
* **Vector DB**: Pinecone - לאחסון ושליפה של מידע סמנטי.
* **Language**: TypeScript - להבטחת Type Safety לאורך כל הזרמת הנתונים.

---

## 🚀 הוראות הרצה (Getting Started)

1.  שכפלו את ה-Repository.
2.  היכנסו לתיקיית הסוכן: `cd agent-knowledge-rag`.
3.  התקינו תלויות: `npm install`.
4.  צרו קובץ `.env` עם המפתחות:
    * `COHERE_API_KEY`
    * `PINECONE_API_KEY`
5.  הריצו את המערכת:
    ```bash
    npx tsx app.ts
    ```

---

## 📝 תובנות מהפיתוח (Reflections)

* **Hybrid RAG Approach**: השילוב בין מידע מובנה (JSON) לבלתי מובנה (Vector DB) מאפשר לסוכן להיות גם מהיר ומדויק בחוקים יבשים וגם גמיש בהבנת מסמכים.
* **State Management**: ניהול ה-Workflow כ-State Machine אפשר שליטה מלאה על תהליך ה-Retry וה-Error Handling, מה שמונע מהמשתמש לקבל תשובות שגויות או ריקות.
* **Type Safety**: השימוש ב-TypeScript מנע שגיאות קריטיות בזמן העברת אובייקטים מורכבים מה-LLM אל ממשק המשתמש.

---

### 🧪 דוגמאות לשאילתות לבדיקה:
* *"What are the rules for using 'any' in this project?"* (מפעיל את ה-Router ל-JSON).
* *"Explain the architecture of the Todo app."* (שולף מידע מ-Pinecone).
* *"How do I make a pizza?"* (יפעיל את מנגנון ה-Retry או יחזיר הודעת חוסר מידע רלוונטי).

(presentation.gif)[Demo]!
