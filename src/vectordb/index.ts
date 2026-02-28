/**
 * Módulo de vectorización para RAG de estructuras
 *
 * Exporta funcionalidades para:
 * - Generar embeddings con OpenAI
 * - Almacenar vectores en ChromaDB local
 * - Procesar PDFs y documentos de texto
 * - Búsqueda semántica
 */

export {
  generateEmbedding,
  generateEmbeddings,
  EMBEDDING_DIMENSION,
} from './embeddings.js';

export {
  initVectorStore,
  addDocuments,
  searchDocuments,
  searchDocumentsWithTimings,
  getChunkContent,
  isDocumentIndexed,
  deleteDocumentsBySource,
  getStoreStats,
  type DocumentChunk,
  type SearchResult,
  type SearchTimings,
  type SearchResultWithTimings,
} from './store.js';

export {
  extractTextFromPDF,
  extractTextFromFile,
  chunkText,
  processPDF,
  processTextFile,
  processDirectory,
} from './processor.js';

export {
  tokenize,
  buildBM25Index,
  saveBM25Index,
  loadBM25Index,
  searchBM25,
  bm25IndexExists,
  type BM25Result,
} from './bm25.js';

export {
  hybridSearch,
  type SearchMethod,
  type HybridSearchOptions,
  type HybridTimings,
  type HybridSearchResult,
} from './hybrid-search.js';

export { rewriteQuery } from './query-rewriter.js';

export { rerankResults } from './reranker.js';

export {
  enrichMetadata,
  getAvailableTemas,
  getAvailableNormas,
  getAvailableColecciones,
  type EnrichedMetadata,
  type Coleccion,
} from './metadata-enricher.js';
