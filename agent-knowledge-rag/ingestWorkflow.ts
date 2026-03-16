

// type Document = {
//   id: string;
//   content: string;
//   metadata: { file_path?: string };
// };

// type Chunk = {
//   text: string;
//   docId: string;
// };

// type Embedding = {
//   vector: number[];
//   chunkId: string;
// };

// // תיאור שלבים ב-Ingest
// type IngestEvent =
//   | { type: "START"; payload?: {} }
//   | { type: "API_KEYS_VALIDATED"; payload: { pinecone: boolean; cohere: boolean } }
//   | { type: "COHERE_READY"; payload: { cohereApiKey: string } }
//   | { type: "PINECONE_CONNECTED"; payload: { exists: boolean; indexName: string } }
//   | { type: "PINECONE_INDEX_READY"; payload: { indexName: string } }
//   | { type: "DOCUMENTS_LOADED"; payload: { documents: Document[], filteredCount: number, totalCount: number } }
//   | { type: "DOCUMENTS_CHUNKED"; payload: { chunks: Chunk[] } }
//   | { type: "EMBEDDINGS_CREATED"; payload: { embeddings: Embedding[] } }
//   | { type: "EMBEDDINGS_UPLOADED"; payload: { count: number } }
//   | { type: "SUCCESS"; payload?: { message: string } }
//   | { type: "ERROR"; payload: { step: string; error: string } }

//   type IngestState = {
//   documents?: Document[];
//   chunks?: Chunk[];
//   embeddings?: Embedding[];
//   pineconeReady?: boolean;
//   cohereReady?: boolean;
//   indexName?: string;
// };

